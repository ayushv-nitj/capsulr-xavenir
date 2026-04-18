const mongoose = require("mongoose");

const ghostMessageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isExpired: { type: Boolean, default: false },
  reactions: [
    {
      emoji: String,
      count: { type: Number, default: 1 },
    },
  ],
});

const ghostWallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ["public", "private"], 
    required: true 
  },
  accessCode: { 
    type: String, 
    unique: true, 
    sparse: true // Only for private walls
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  messages: [ghostMessageSchema],
  settings: {
    messageLifetime: { 
      type: Number, 
      default: 24 // hours
    },
    maxMessageLength: { 
      type: Number, 
      default: 500 
    },
    allowReactions: { 
      type: Boolean, 
      default: true 
    },
  },
  createdAt: { type: Date, default: Date.now },
});

// Auto-expire messages
ghostWallSchema.methods.cleanExpiredMessages = function() {
  const now = new Date();
  this.messages = this.messages.filter(msg => {
    if (now > msg.expiresAt && !msg.isExpired) {
      msg.isExpired = true;
      return false;
    }
    return !msg.isExpired;
  });
  return this.save();
};

module.exports = mongoose.model("GhostWall", ghostWallSchema);
