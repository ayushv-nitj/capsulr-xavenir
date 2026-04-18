const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,
  profileImage: {
    type: String,
    default: ""
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
