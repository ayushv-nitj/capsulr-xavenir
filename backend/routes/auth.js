const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// GOOGLE SIGN-IN
// Frontend sends the Google ID token; we verify it and return our own JWT.
router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user or create a new one (no password needed)
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture || "",
      });
    } else if (!user.googleId) {
      // Existing email-account — link Google ID
      user.googleId = googleId;
      if (!user.profileImage && picture) user.profileImage = picture;
      await user.save();
    }

    // Issue our own JWT (same shape as before so middleware is unchanged)
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
    res.status(401).json({ message: "Invalid Google token" });
  }
});

module.exports = router;
