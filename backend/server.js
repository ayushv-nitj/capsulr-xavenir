const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

// const cors = require("cors");

app.use(cors({
  origin: [
    "http://localhost:3000",
    // IMPORTANT: no trailing slash here, CORS checks must match exactly
    "https://capsulr-five.vercel.app"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] ,
  credentials: true
}));

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/capsules", require("./routes/capsule"));
app.use("/api/memories", require("./routes/memory"));
app.use("/api/reactions", require("./routes/reaction"));
app.use("/api/comments", require("./routes/comment"));
app.use("/api/ghostwalls", require("./routes/ghostwall"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Auto-unlock capsules every minute
setInterval(async () => {
  // Use correct case for the Capsule model so it works on case-sensitive filesystems (e.g. Linux in production)
  const Capsule = require("./models/Capsule");
  const User = require("./models/User");
  const { sendEmail } = require("./utils/mailer");
  const pusher = require("./config/pusher");
  
  const now = new Date();
  
  // 1. Auto-unlock capsules
  const capsulestoUnlock = await Capsule.find({
    isLocked: true,
    unlockAt: { $lte: now }
  }).populate("owner", "name email profileImage")
    .populate("contributors", "name email profileImage");

  for (const capsule of capsulestoUnlock) {
    capsule.isLocked = false;
    capsule.isUnlocked = true;
    await capsule.save();

    // Collect all users who should be notified
    const notifyEmails = [];
    
    // Add owner
    if (capsule.owner?.email) {
      notifyEmails.push(capsule.owner.email);
    }
    
    // Add contributors
    if (capsule.contributors?.length) {
      capsule.contributors.forEach(contributor => {
        if (contributor.email) notifyEmails.push(contributor.email);
      });
    }
    
    // Add recipients
    if (capsule.recipients?.length) {
      notifyEmails.push(...capsule.recipients);
    }

    // Send real-time unlock notifications
    try {
      for (const email of notifyEmails) {
        await pusher.trigger(`user-${email}`, 'capsule-unlocked', {
          capsule: {
            _id: capsule._id,
            title: capsule.title,
            theme: capsule.theme,
            isLocked: false,
            isUnlocked: true,
            unlockAt: capsule.unlockAt
          },
          message: `🎉 "${capsule.title}" has unlocked!`
        });
      }
    } catch (error) {
      console.error('Error sending unlock notifications:', error);
    }

    // Email all recipients
    if (capsule.recipients?.length) {
      for (const email of capsule.recipients) {
        await sendEmail({
          to: email,
          subject: "🎉 A Time Capsule has unlocked!",
          html: `
            <h2>Your capsule is ready!</h2>
            <p><b>${capsule.title}</b> has unlocked.</p>
            <p><a href="http://localhost:3000/recipient/${capsule._id}/${email}">View Capsule</a></p>
          `
        });
      }
    }
  }

  // 2. Handle expired capsules (send notifications)
  const expiredCapsules = await Capsule.find({
    isDestroyed: false,
    recipientViews: {
      $elemMatch: {
        expiresAt: { $lte: now }
      }
    }
  });

  for (const capsule of expiredCapsules) {
    // Find expired views
    const expiredViews = capsule.recipientViews.filter(view => 
      view.expiresAt && new Date(view.expiresAt) <= now
    );

    for (const view of expiredViews) {
      try {
        // Send real-time expiry notification
        await pusher.trigger(`user-${view.email}`, 'capsule-expired', {
          capsule: {
            _id: capsule._id,
            title: capsule.title,
            theme: capsule.theme
          },
          message: `⏰ "${capsule.title}" has expired and is no longer accessible`
        });

        // Send email notification
        await sendEmail({
          to: view.email,
          subject: "⏰ Time Capsule Expired",
          html: `
            <h2>Capsule Expired</h2>
            <p>The time capsule <b>"${capsule.title}"</b> has expired and is no longer accessible.</p>
            <p>Thank you for being part of this memory!</p>
          `
        });
      } catch (error) {
        console.error('Error sending expiry notifications:', error);
      }
    }
  }
}, 60000); // Check every minute

// Auto-clean expired ghost wall messages every 5 minutes
setInterval(async () => {
  const GhostWall = require("./models/GhostWall");
  
  try {
    const walls = await GhostWall.find({});
    
    for (const wall of walls) {
      await wall.cleanExpiredMessages();
    }
    
    console.log(`Cleaned expired messages from ${walls.length} ghost walls`);
  } catch (error) {
    console.error('Error cleaning expired messages:', error);
  }
}, 300000); // Check every 5 minutes