const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema({
  title: String,
  theme: String,

  unlockType: {
    type: String,
    enum: ["date", "event"]
  },

  unlockAt: {
    type: Date,
    required: true
  },
  
  unlockEvent: String,

  // View Once Feature
  isViewOnce: {
    type: Boolean,
    default: false
  },

  // Expiry Feature
  expiryDuration: {
    type: Number, // Duration in hours after first view
    default: null
  },

  // Track recipient views for view-once and expiry
  recipientViews: {
    type: [{
      email: String,
      viewedAt: Date,
      expiresAt: Date // Calculated when first viewed
    }],
    default: []
  },

  // Status tracking
  isDestroyed: {
    type: Boolean,
    default: false
  },

  destroyedAt: Date,

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  recipients: [String],

  contributors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  isLocked: {
    type: Boolean,
    default: true
  },

  isUnlocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports =
  mongoose.models.Capsule ||
  mongoose.model("Capsule", capsuleSchema);
