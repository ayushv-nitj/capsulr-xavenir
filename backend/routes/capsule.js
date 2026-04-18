const express = require("express");
const Capsule = require("../models/Capsule");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendEmail } = require("../utils/mailer");
const pusher = require("../config/pusher");

const router = express.Router();

// simple auth middleware
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

// CREATE CAPSULE
router.post("/", auth, async (req, res) => {
  console.log("CAPSULE API HIT");
  console.log("BODY:", req.body);
  console.log("USER:", req.userId);

  const capsule = await Capsule.create({
    ...req.body,
    owner: req.userId
  });

  // Populate the capsule with owner details for real-time updates
  const populatedCapsule = await Capsule.findById(capsule._id)
    .populate("owner", "name email profileImage");

  // Trigger real-time events for collaborators and recipients
  try {
    // Get all user emails that should receive this update
    const notifyEmails = [];
    
    // Add contributors (if any)
    if (req.body.contributors && req.body.contributors.length > 0) {
      const contributors = await User.find({ _id: { $in: req.body.contributors } });
      contributors.forEach(user => notifyEmails.push(user.email));
    }
    
    // Add recipients (if any)
    if (req.body.recipients && req.body.recipients.length > 0) {
      notifyEmails.push(...req.body.recipients);
    }

    // Trigger real-time event for each user
    for (const email of notifyEmails) {
      await pusher.trigger(`user-${email}`, 'capsule-created', {
        capsule: populatedCapsule,
        message: `New capsule "${populatedCapsule.title}" has been shared with you!`
      });
    }
  } catch (error) {
    console.error('Error sending real-time notifications:', error);
  }

  res.json(capsule);
});






// GET ALL CAPSULES FOR A RECIPIENT (no auth)
router.get("/recipient-list/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    const capsules = await Capsule.find({
      recipients: email
    })
    .populate("owner", "name email profileImage")
    .sort({ unlockAt: 1 });

    // Auto-unlock any that should be unlocked
    const now = new Date();
    for (const capsule of capsules) {
      if (capsule.isLocked && capsule.unlockAt && now >= capsule.unlockAt) {
        capsule.isLocked = false;
        capsule.isUnlocked = true;
        await capsule.save();
      }
    }

    res.json(capsules);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch capsules" });
  }
});










// GET ALL CAPSULES FOR USER (DASHBOARD)
router.get("/", auth, async (req, res) => {
  try {
    // Get user email for recipient check
    const User = require("../models/User");
    const user = await User.findById(req.userId);
    
    const capsules = await Capsule.find({
      $or: [
        { owner: req.userId },
        { contributors: req.userId },
        { recipients: user.email }  // Include capsules where user is a recipient
      ]
    }).sort({ createdAt: -1 });

    // 🔐 Auto-unlock capsules whose time has passed
    const now = new Date();

    const updatedCapsules = await Promise.all(
      capsules.map(async (capsule) => {
        if (capsule.isLocked && capsule.unlockAt && now >= capsule.unlockAt) {
          capsule.isLocked = false;
          await capsule.save();
        }
        return capsule;
      })
    );

    res.json(updatedCapsules);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch capsules" });
  }
});

// GET SINGLE CAPSULE (with collaborators populated)
router.get("/:id", auth, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id)
      .populate("contributors", "name email profileImage")
      .populate("owner", "name email profileImage");
    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    // Check access permissions
    const isOwner = capsule.owner._id.toString() === req.userId;
    const isContributor = capsule.contributors.some(c => c._id.toString() === req.userId);
    const User = require("../models/User");
    const user = await User.findById(req.userId);
    const isRecipient = capsule.recipients.includes(user.email);

    // Allow access if user is owner, contributor, or recipient
    if (!isOwner && !isContributor && !isRecipient) {
      return res.status(403).json({ message: "Not authorized to access this capsule" });
    }

    // 🔐 Auto-unlock when time passes
    const now = new Date();
    if (capsule.isLocked && capsule.unlockAt && now >= capsule.unlockAt) {
      capsule.isLocked = false;
      capsule.isUnlocked = true;
      await capsule.save();

      // Send real-time unlock notification
      try {
        const notifyEmails = [];
        
        // Add owner
        if (capsule.owner?.email) notifyEmails.push(capsule.owner.email);
        
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

      // 📧 EMAIL RECIPIENTS
      if (capsule.recipients?.length) {
        for (const email of capsule.recipients) {
          await sendEmail({
            to: email,
            subject: "🎉 A Time Capsule has unlocked!",
            html: `
              <h2>Your capsule is ready!</h2>
              <p><b>${capsule.title}</b> has unlocked and is ready to view!</p>
              <p><a href="http://localhost:3000/recipient/${capsule._id}/${email}" style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Open Capsule</a></p>
              <p style="margin-top:16px;"><a href="http://localhost:3000/recipient/dashboard/${email}" style="color:#8b5cf6;">View All Your Capsules</a></p>
            `
          });
        }
      }
    }

    res.json(capsule);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch capsule" });
  }
});

// UPDATE CAPSULE
router.put("/:id", auth, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    if (capsule.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await Capsule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
});


// DELETE CAPSULE
router.delete("/:id", auth, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    // only owner can delete
    if (capsule.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Capsule.findByIdAndDelete(req.params.id);
    res.json({ message: "Capsule deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ADD COLLABORATOR BY EMAIL
router.post("/:id/collaborators", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const capsule = await Capsule.findById(req.params.id)
      .populate("owner", "name email profileImage")
      .populate("contributors", "name email profileImage");
    if (!capsule) return res.status(404).json({ message: "Capsule not found" });

    if (capsule.owner._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Only owner can add collaborators" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (capsule.contributors.some(c => c._id.toString() === user._id.toString())) {
      return res.status(400).json({ message: "Already a collaborator" });
    }

    capsule.contributors.push(user._id);
    await capsule.save();

    // Trigger real-time event for the new collaborator
    try {
      await pusher.trigger(`user-${email}`, 'capsule-shared', {
        capsule: {
          _id: capsule._id,
          title: capsule.title,
          theme: capsule.theme,
          isLocked: capsule.isLocked,
          unlockAt: capsule.unlockAt,
          owner: capsule.owner,
          contributors: capsule.contributors,
          recipients: capsule.recipients
        },
        message: `You've been added as a collaborator to "${capsule.title}"!`,
        role: 'collaborator'
      });
    } catch (error) {
      console.error('Error sending collaborator notification:', error);
    }

    // 📧 SEND EMAIL
    await sendEmail({
      to: email,
      subject: "You've been added to a Time Capsule 🎁",
      html: `
        <h2>You're now a collaborator on a Time Capsule!</h2>
        <p><b>${capsule.title}</b> has been shared with you as a collaborator.</p>
        <p>It will unlock on: <b>${new Date(capsule.unlockAt).toLocaleString()}</b></p>
        <p>You can now add memories and edit the capsule!</p>
        <p><a href="http://localhost:3000/dashboard" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">View Your Dashboard</a></p>
      `
    });

    res.json({ message: "Collaborator added & email sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add collaborator" });
  }
});

// SEND EMAIL TO RECIPIENTS WHEN ADDED
router.post("/:id/notify-recipients", auth, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);
    if (!capsule) return res.status(404).json({ message: "Capsule not found" });

    if (capsule.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Only owner can notify recipients" });
    }

    const { newRecipients } = req.body; // Array of newly added emails

    // Send real-time notifications to new recipients
    try {
      for (const email of newRecipients) {
        await pusher.trigger(`user-${email}`, 'capsule-shared', {
          capsule: {
            _id: capsule._id,
            title: capsule.title,
            theme: capsule.theme,
            isLocked: capsule.isLocked,
            unlockAt: capsule.unlockAt,
            owner: capsule.owner,
            contributors: capsule.contributors,
            recipients: capsule.recipients
          },
          message: `You've been added as a recipient to "${capsule.title}"!`,
          role: 'recipient'
        });
      }
    } catch (error) {
      console.error('Error sending recipient notifications:', error);
    }

    for (const email of newRecipients) {
      await sendEmail({
        to: email,
        subject: "You've been added to a Time Capsule 🎁",
        html: `
          <h2>You're a recipient of a Time Capsule!</h2>
          <p><b>${capsule.title}</b> has been shared with you.</p>
          <p>It will unlock on: <b>${new Date(capsule.unlockAt).toLocaleDateString()}</b></p>
          <p>You'll receive another email when it unlocks!</p>
          <p><a href="http://localhost:3000/dashboard" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">View Your Dashboard</a></p>
        `
      });
    }

    res.json({ message: "Recipients notified" });
  } catch (err) {
    res.status(500).json({ message: "Failed to notify recipients" });
  }
});

// GET CAPSULE BY EMAIL (for recipients, no auth required)
router.get("/recipient/:id/:email", async (req, res) => {
  try {
    const { id, email } = req.params;
    console.log(`🔍 Recipient ${email} accessing capsule ${id}`);
    
    let capsule = await Capsule.findById(id)
      .populate("contributors", "name email profileImage")
      .populate("owner", "name email profileImage");
      
    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    // Verify email is a recipient
    if (!capsule.recipients || !capsule.recipients.includes(email)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    console.log(`📋 Capsule info - isViewOnce: ${capsule.isViewOnce}, recipientViews: ${capsule.recipientViews?.length || 0}`);
    console.log(`📋 Recipient views:`, JSON.stringify(capsule.recipientViews, null, 2));

    // Check if capsule is destroyed for this recipient
    if (capsule.isDestroyed) {
      console.log(`💥 Capsule is destroyed`);
      return res.status(410).json({ message: "This capsule has been destroyed" });
    }

    // Auto-unlock if time passed
    const now = new Date();
    if (capsule.isLocked && capsule.unlockAt && now >= capsule.unlockAt) {
      capsule.isLocked = false;
      capsule.isUnlocked = true;
      await capsule.save();

      // Send real-time unlock notification
      try {
        const notifyEmails = [];
        
        // Add owner
        if (capsule.owner?.email) notifyEmails.push(capsule.owner.email);
        
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

        for (const userEmail of notifyEmails) {
          await pusher.trigger(`user-${userEmail}`, 'capsule-unlocked', {
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
    }

    // 🔥 ATOMIC VIEW TRACKING FOR VIEW-ONCE CAPSULES
    // This prevents race conditions by checking and tracking views in a single atomic operation
    if (capsule.isViewOnce && !capsule.isLocked) {
      console.log(`🔥 View-once capsule - checking for existing view atomically`);
      
      // Check if already viewed
      const existingView = capsule.recipientViews.find(view => view.email === email);
      
      if (existingView) {
        console.log(`🔥 View-once capsule already viewed by ${email} at ${existingView.viewedAt} - blocking access`);
        return res.status(410).json({ 
          message: "This capsule can only be viewed once and has already been viewed" 
        });
      }
      
      // First view - atomically add view record using findOneAndUpdate
      // This ensures only ONE concurrent request can add the view
      const viewedAt = new Date();
      let expiresAt = null;
      
      if (capsule.expiryDuration) {
        expiresAt = new Date(viewedAt.getTime() + (capsule.expiryDuration * 60 * 60 * 1000));
        console.log(`⏰ Setting expiry for ${email}: ${expiresAt}`);
      }
      
      console.log(`📊 Attempting atomic view tracking for ${email}`);
      const updatedCapsule = await Capsule.findOneAndUpdate(
        {
          _id: id,
          recipients: email,
          'recipientViews.email': { $ne: email } // Ensure no existing view (atomic check)
        },
        {
          $push: {
            recipientViews: {
              email,
              viewedAt,
              expiresAt
            }
          }
        },
        { new: true }
      ).populate("contributors", "name email profileImage")
        .populate("owner", "name email profileImage");
      
      // If update failed, another request already added the view (race condition handled)
      if (!updatedCapsule) {
        console.log(`🔥 Atomic update failed - view already exists (concurrent request) - blocking access`);
        return res.status(410).json({ 
          message: "This capsule can only be viewed once and has already been viewed" 
        });
      }
      
      console.log(`✅ View tracked atomically for ${email} - first and only view allowed`);
      console.log(`💥 Capsule will now appear as DESTROYED in dashboard for ${email}`);
      capsule = updatedCapsule;
    }
    
    // For non-view-once capsules with expiry, track view for expiry calculation
    if (!capsule.isViewOnce && capsule.expiryDuration && !capsule.isLocked) {
      const existingView = capsule.recipientViews.find(view => view.email === email);
      
      if (!existingView) {
        // Track first view for expiry timer (but allow multiple accesses)
        const viewedAt = new Date();
        const expiresAt = new Date(viewedAt.getTime() + (capsule.expiryDuration * 60 * 60 * 1000));
        
        console.log(`⏰ Tracking first view for expiry (non-view-once) - expires at ${expiresAt}`);
        await Capsule.findByIdAndUpdate(id, {
          $push: {
            recipientViews: { email, viewedAt, expiresAt }
          }
        });
      }
      
      // Check if expired
      if (existingView && existingView.expiresAt && new Date() > existingView.expiresAt) {
        console.log(`⏰ Capsule expired for ${email}`);
        return res.status(410).json({ message: "This capsule has expired" });
      }
    }

    // Return capsule data (frontend will handle locked state)
    res.json(capsule);
  } catch (err) {
    console.error('❌ Error in recipient GET route:', err);
    res.status(500).json({ message: "Failed to fetch capsule" });
  }
});

// TRACK RECIPIENT VIEW (DEPRECATED - view tracking now happens in GET request)
// Kept for backward compatibility, but now idempotent
router.post("/recipient/:id/:email/view", async (req, res) => {
  try {
    const { id, email } = req.params;
    console.log(`📊 [DEPRECATED] POST view tracking called for capsule ${id} by ${email}`);
    console.log(`ℹ️  View tracking now happens automatically in GET request`);
    
    const capsule = await Capsule.findById(id);
    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    // Verify email is a recipient
    if (!capsule.recipients || !capsule.recipients.includes(email)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if already tracked
    const existingView = capsule.recipientViews.find(view => view.email === email);
    
    if (existingView) {
      console.log(`👁️ View already tracked at ${existingView.viewedAt} - returning existing data`);
      return res.json({ 
        message: "Already tracked", 
        viewedAt: existingView.viewedAt,
        expiresAt: existingView.expiresAt,
        isViewOnce: capsule.isViewOnce
      });
    }

    // If somehow called before GET (shouldn't happen with new frontend), track the view
    const viewedAt = new Date();
    let expiresAt = null;

    if (capsule.expiryDuration) {
      expiresAt = new Date(viewedAt.getTime() + (capsule.expiryDuration * 60 * 60 * 1000));
      console.log(`⏰ Expiry set for ${email}: ${expiresAt}`);
    }

    capsule.recipientViews.push({ email, viewedAt, expiresAt });
    await capsule.save();
    console.log(`✅ View tracked via POST (fallback) for ${email}`);

    res.json({ 
      message: "View tracked", 
      viewedAt, 
      expiresAt,
      isViewOnce: capsule.isViewOnce 
    });
  } catch (err) {
    console.error('❌ Error tracking view:', err);
    res.status(500).json({ message: "Failed to track view" });
  }
});

// GET MEMORIES FOR RECIPIENT (no auth)
router.get("/recipient/:capsuleId/:email/memories", async (req, res) => {
  try {
    const { capsuleId, email } = req.params;
    
    const capsule = await Capsule.findById(capsuleId);
    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    if (!capsule.recipients || !capsule.recipients.includes(email)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only return memories if unlocked
    if (capsule.isLocked) {
      return res.json([]);
    }

    const Memory = require("../models/Memory");
    const memories = await Memory.find({ capsuleId });
    
    // Ensure we always return an array
    res.json(Array.isArray(memories) ? memories : []);
  } catch (err) {
    console.error('Error fetching recipient memories:', err);
    res.status(500).json({ message: "Failed to fetch memories" });
  }
});

// DEBUG: Check capsule view status
router.get("/debug/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const capsule = await Capsule.findById(id);
    
    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    res.json({
      id: capsule._id,
      title: capsule.title,
      isViewOnce: capsule.isViewOnce,
      expiryDuration: capsule.expiryDuration,
      recipientViews: capsule.recipientViews,
      recipients: capsule.recipients,
      isLocked: capsule.isLocked,
      isDestroyed: capsule.isDestroyed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEST EMAIL
router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "YOUR_TEST_EMAIL@gmail.com", // Change this
      subject: "Test Email",
      html: "<h1>Email working!</h1>"
    });
    res.json({ message: "Email sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;