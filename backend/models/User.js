const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: { type: String, default: null }, // null for Google OAuth users
  googleId: { type: String, default: null },
  profileImage: {
    type: String,
    default: ""
  }
});

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
