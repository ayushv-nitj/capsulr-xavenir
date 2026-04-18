const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Capsule = require("../models/Capsule");
const { 
  generateMemoryPrompts, 
  enhanceMemoryContent,
  generateTitleSuggestions 
} = require("../services/aiService");

const router = express.Router();

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET personalized memory prompts
router.get("/prompts", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const capsules = await Capsule.find({ owner: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Build user context
    const lastCapsule = capsules[0];
    const recentThemes = [...new Set(capsules.map(c => c.theme))].slice(0, 3);
    
    const now = new Date();
    const month = now.getMonth();
    let currentSeason;
    if (month >= 2 && month <= 4) currentSeason = "Spring";
    else if (month >= 5 && month <= 7) currentSeason = "Summer";
    else if (month >= 8 && month <= 10) currentSeason = "Fall";
    else currentSeason = "Winter";

    const userContext = {
      userName: user.name,
      lastCapsuleDate: lastCapsule ? lastCapsule.createdAt.toLocaleDateString() : null,
      capsuleCount: capsules.length,
      recentThemes,
      currentSeason
    };

    const prompts = await generateMemoryPrompts(userContext);
    res.json({ prompts });
  } catch (error) {
    console.error("Error generating prompts:", error);
    res.status(500).json({ message: "Failed to generate prompts" });
  }
});

// POST enhance memory content
router.post("/enhance", auth, async (req, res) => {
  try {
    const { content, theme } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ 
        message: "Content must be at least 10 characters long" 
      });
    }

    const enhancement = await enhanceMemoryContent(content, theme || "General");
    res.json(enhancement);
  } catch (error) {
    console.error("Error enhancing content:", error);
    res.status(500).json({ message: "Failed to enhance content" });
  }
});

// POST generate title suggestions
router.post("/titles", auth, async (req, res) => {
  try {
    const { content, theme } = req.body;

    if (!content || !theme) {
      return res.status(400).json({ 
        message: "Content and theme are required" 
      });
    }

    const titles = await generateTitleSuggestions(content, theme);
    res.json({ titles });
  } catch (error) {
    console.error("Error generating titles:", error);
    res.status(500).json({ message: "Failed to generate titles" });
  }
});

module.exports = router;
