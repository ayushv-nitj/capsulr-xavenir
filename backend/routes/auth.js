const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// GOOGLE SIGN-IN
// Verify the Google ID token via Google's tokeninfo endpoint (no extra package needed).
router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    // Call Google's public tokeninfo endpoint to validate the token
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    const payload = await googleRes.json();

    if (!googleRes.ok || payload.error) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    // Ensure the token was issued for our app
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Token audience mismatch" });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find existing user or create a new one
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture || "",
      });
    } else if (!user.googleId) {
      // Link Google ID to existing account
      user.googleId = googleId;
      if (!user.profileImage && picture) user.profileImage = picture;
      await user.save();
    }

    // Issue our own JWT (same shape as before — all other middleware unchanged)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        id: user._id,
        profileImage: user.profileImage || "",
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Authentication failed" });
  }
});

module.exports = router;
