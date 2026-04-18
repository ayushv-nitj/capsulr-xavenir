const express = require("express");
const GhostWall = require("../models/GhostWall");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const router = express.Router();

// Auth middleware (optional for some routes)
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

// Generate unique access code
function generateAccessCode() {
  return crypto.randomBytes(8).toString("hex");
}

// CREATE GHOST WALL (requires auth)
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, type, messageLifetime, maxMessageLength, allowReactions } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const wallData = {
      name,
      description,
      type,
      createdBy: req.userId,
      settings: {
        messageLifetime: messageLifetime || 24,
        maxMessageLength: maxMessageLength || 500,
        allowReactions: allowReactions !== false,
      },
    };

    // Generate access code for private walls
    if (type === "private") {
      wallData.accessCode = generateAccessCode();
    }

    const wall = await GhostWall.create(wallData);
    res.json(wall);
  } catch (err) {
    console.error("Error creating ghost wall:", err);
    res.status(500).json({ message: "Failed to create ghost wall" });
  }
});

// GET ALL PUBLIC WALLS
router.get("/public", async (req, res) => {
  try {
    const walls = await GhostWall.find({ type: "public" })
      .select("-messages") // Don't send messages in list view
      .sort({ createdAt: -1 });
    
    res.json(walls);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch public walls" });
  }
});

// GET USER'S CREATED WALLS (requires auth)
router.get("/my-walls", auth, async (req, res) => {
  try {
    const walls = await GhostWall.find({ createdBy: req.userId })
      .select("-messages")
      .sort({ createdAt: -1 });
    
    res.json(walls);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your walls" });
  }
});

// GET SINGLE WALL BY ID (public walls)
router.get("/public/:id", async (req, res) => {
  try {
    const wall = await GhostWall.findOne({ 
      _id: req.params.id, 
      type: "public" 
    });

    if (!wall) {
      return res.status(404).json({ message: "Wall not found" });
    }

    // Clean expired messages
    await wall.cleanExpiredMessages();

    res.json(wall);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wall" });
  }
});

// GET PRIVATE WALL BY ACCESS CODE (no auth required)
router.get("/private/:accessCode", async (req, res) => {
  try {
    const wall = await GhostWall.findOne({ 
      accessCode: req.params.accessCode,
      type: "private"
    });

    if (!wall) {
      return res.status(404).json({ message: "Wall not found or invalid access code" });
    }

    // Clean expired messages
    await wall.cleanExpiredMessages();

    res.json(wall);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wall" });
  }
});

// POST MESSAGE TO WALL (no auth required - anonymous)
router.post("/:wallId/messages", async (req, res) => {
  try {
    const { content, accessCode } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Find wall by ID or access code
    let wall;
    if (accessCode) {
      wall = await GhostWall.findOne({ 
        _id: req.params.wallId,
        accessCode 
      });
    } else {
      wall = await GhostWall.findOne({ 
        _id: req.params.wallId,
        type: "public"
      });
    }

    if (!wall) {
      return res.status(404).json({ message: "Wall not found or access denied" });
    }

    // Validate message length
    if (content.length > wall.settings.maxMessageLength) {
      return res.status(400).json({ 
        message: `Message too long. Max ${wall.settings.maxMessageLength} characters` 
      });
    }

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + wall.settings.messageLifetime);

    // Add message
    wall.messages.push({
      content,
      expiresAt,
    });

    await wall.save();

    res.json({ 
      message: "Message posted successfully",
      expiresAt 
    });
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).json({ message: "Failed to post message" });
  }
});

// ADD REACTION TO MESSAGE (no auth required - anonymous)
router.post("/:wallId/messages/:messageId/react", async (req, res) => {
  try {
    const { emoji, accessCode } = req.body;
    const { wallId, messageId } = req.params;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    // Find wall
    let wall;
    if (accessCode) {
      wall = await GhostWall.findOne({ _id: wallId, accessCode });
    } else {
      wall = await GhostWall.findOne({ _id: wallId, type: "public" });
    }

    if (!wall) {
      return res.status(404).json({ message: "Wall not found" });
    }

    if (!wall.settings.allowReactions) {
      return res.status(403).json({ message: "Reactions are disabled for this wall" });
    }

    // Find message
    const message = wall.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Add or increment reaction
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      existingReaction.count += 1;
    } else {
      message.reactions.push({ emoji, count: 1 });
    }

    await wall.save();

    res.json({ message: "Reaction added" });
  } catch (err) {
    console.error("Error adding reaction:", err);
    res.status(500).json({ message: "Failed to add reaction" });
  }
});

// DELETE WALL (requires auth - only creator)
router.delete("/:id", auth, async (req, res) => {
  try {
    const wall = await GhostWall.findById(req.params.id);

    if (!wall) {
      return res.status(404).json({ message: "Wall not found" });
    }

    if (wall.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await GhostWall.findByIdAndDelete(req.params.id);
    res.json({ message: "Wall deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete wall" });
  }
});

// UPDATE WALL SETTINGS (requires auth - only creator)
router.put("/:id", auth, async (req, res) => {
  try {
    const wall = await GhostWall.findById(req.params.id);

    if (!wall) {
      return res.status(404).json({ message: "Wall not found" });
    }

    if (wall.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { name, description, messageLifetime, maxMessageLength, allowReactions } = req.body;

    if (name) wall.name = name;
    if (description !== undefined) wall.description = description;
    if (messageLifetime) wall.settings.messageLifetime = messageLifetime;
    if (maxMessageLength) wall.settings.maxMessageLength = maxMessageLength;
    if (allowReactions !== undefined) wall.settings.allowReactions = allowReactions;

    await wall.save();
    res.json(wall);
  } catch (err) {
    res.status(500).json({ message: "Failed to update wall" });
  }
});

// REGENERATE ACCESS CODE (requires auth - only creator)
router.post("/:id/regenerate-code", auth, async (req, res) => {
  try {
    const wall = await GhostWall.findById(req.params.id);

    if (!wall) {
      return res.status(404).json({ message: "Wall not found" });
    }

    if (wall.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (wall.type !== "private") {
      return res.status(400).json({ message: "Only private walls have access codes" });
    }

    wall.accessCode = generateAccessCode();
    await wall.save();

    res.json({ accessCode: wall.accessCode });
  } catch (err) {
    res.status(500).json({ message: "Failed to regenerate code" });
  }
});

module.exports = router;
