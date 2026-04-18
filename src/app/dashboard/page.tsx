"use client";
import { API_URL } from "@/lib/api";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { usePusher } from "@/hooks/usePusher";

export default function Dashboard() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [capsules, setCapsules] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "locked" | "unlocked" | "expired" | "destroyed">("all");

  // tick state so countdowns update each second
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Real-time event handlers
  const handleCapsuleCreated = useCallback((data: any) => {
    console.log('New capsule created:', data);
    // Check if capsule already exists before adding
    setCapsules(prev => {
      const exists = prev.some(c => c._id === data.capsule._id);
      if (exists) {
        console.log('Capsule already exists, skipping duplicate');
        return prev;
      }
      return [data.capsule, ...prev];
    });
    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('New Capsule!', {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  }, []);

  const handleCapsuleShared = useCallback((data: any) => {
    console.log('Capsule shared with you:', data);
    // Check if capsule already exists before adding
    setCapsules(prev => {
      const exists = prev.some(c => c._id === data.capsule._id);
      if (exists) {
        console.log('Capsule already exists, skipping duplicate');
        return prev;
      }
      return [data.capsule, ...prev];
    });
    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('Capsule Shared!', {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  }, []);

  const handleCapsuleUnlocked = useCallback((data: any) => {
    console.log('Capsule unlocked:', data);
    setCapsules(prev => prev.map(capsule => 
      capsule._id === data.capsule._id 
        ? { ...capsule, isLocked: false, isUnlocked: true }
        : capsule
    ));
    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('Capsule Unlocked!', {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  }, []);

  const handleCapsuleExpired = useCallback((data: any) => {
    console.log('Capsule expired:', data);
    // Refresh capsules to update the UI
    const fetchCapsules = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/capsules`, {
        headers: { Authorization: token || "" },
      });
      const capsuleData = await res.json();
      setCapsules(capsuleData);
    };
    fetchCapsules();
    
    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('Capsule Expired!', {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  }, []);

  // Set up Pusher real-time events
  usePusher(email, {
    onCapsuleCreated: handleCapsuleCreated,
    onCapsuleShared: handleCapsuleShared,
    onCapsuleUnlocked: handleCapsuleUnlocked,
    onCapsuleExpired: handleCapsuleExpired
  });

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Helper functions for capsule status
  const isExpiredForUser = (capsule: any) => {
    if (!capsule.recipientViews || !email) return false;
    const userView = capsule.recipientViews.find((view: any) => view.email === email);
    return userView && userView.expiresAt && new Date() > new Date(userView.expiresAt);
  };

  const isDestroyedForUser = (capsule: any) => {
    if (!capsule.isViewOnce || !capsule.recipientViews || !email) return false;
    const userView = capsule.recipientViews.find((view: any) => view.email === email);
    return userView !== undefined; // If viewed and it's view-once, it's destroyed
  };

function getTimeLeft(unlockAt: string) {
  const unlockTime = new Date(unlockAt).getTime();
  const now = Date.now();
  const diff = unlockTime - now;
  
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}
  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const storedName = localStorage.getItem("name") || "";
    const storedEmail = localStorage.getItem("email") || "";
    const img = localStorage.getItem("profileImage");

    setName(storedName);
    setEmail(storedEmail);
    setProfileImage(img);

    const fetchCapsules = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/capsules`, {
        headers: {
          Authorization: token || "",
        },
      });

      const data = await res.json();
      setCapsules(data);
    };

    fetchCapsules();
  }, []);

  const gradients = [
    "from-cyan-400 to-blue-500",
    "from-purple-400 to-pink-500",
    "from-green-400 to-emerald-500",
    "from-orange-400 to-red-500",
    "from-yellow-400 to-orange-500",
    "from-pink-400 to-rose-500",
    "from-indigo-400 to-purple-500",
    "from-teal-400 to-cyan-500",
  ];

  const filtered = capsules.filter((c) => {
    const matchesQuery =
      c.title?.toLowerCase().includes(query.toLowerCase()) ||
      c.theme?.toLowerCase().includes(query.toLowerCase());
    
    // Helper function to check if capsule is expired for current user
    const isExpired = () => {
      if (!c.recipientViews || !email) return false;
      const userView = c.recipientViews.find((view: any) => view.email === email);
      return userView && userView.expiresAt && new Date() > new Date(userView.expiresAt);
    };

    // Helper function to check if capsule is destroyed for current user
    const isDestroyed = () => {
      if (!c.isViewOnce || !c.recipientViews || !email) return false;
      const userView = c.recipientViews.find((view: any) => view.email === email);
      return userView !== undefined; // If viewed and it's view-once, it's destroyed
    };
    
    if (filterStatus === "locked") return matchesQuery && c.isLocked;
    if (filterStatus === "unlocked") return matchesQuery && !c.isLocked && !isExpired() && !isDestroyed();
    if (filterStatus === "expired") return matchesQuery && isExpired();
    if (filterStatus === "destroyed") return matchesQuery && isDestroyed();
    return matchesQuery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Top Section */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left: Profile & Branding */}
                <div className="flex items-center gap-4">
                  <Link href="/profile" className="block group">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <img
                        src={profileImage || getAvatarUrl(email)}
                        alt="Profile"
                        className="w-16 h-16 rounded-full border-4 border-white/30 shadow-lg object-cover"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </motion.div>
                  </Link>

                  <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
                      Welcome back, {name.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-white/80 text-sm">
                      {capsules.length} capsule{capsules.length !== 1 ? "s" : ""} • {filtered.filter(c => c.isLocked).length} locked
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/ghostwall")}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-white/20"
                  >
                    <span className="text-xl">👻</span>
                    <span className="hidden sm:inline">Ghost Wall</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/dashboard/create")}
                    className="flex items-center gap-2 bg-white text-purple-600 font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-purple-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Create Capsule</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="text-white/90 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-full transition backdrop-blur-sm border border-white/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Search & Filters */}
            <div className="p-6 bg-gradient-to-b from-slate-900/40 to-slate-900/60 backdrop-blur-sm border-t border-white/5">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search capsules by title or theme..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/70 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {["all", "locked", "unlocked", "expired", "destroyed"].map((status) => (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterStatus(status as any)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                        filterStatus === status
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                          : "bg-slate-800/70 text-gray-300 hover:bg-slate-700/70 border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {status === "all" && "✨ All"}
                      {status === "locked" && "🔒 Locked"}
                      {status === "unlocked" && "🔓 Unlocked"}
                      {status === "expired" && "⏰ Expired"}
                      {status === "destroyed" && "💥 Destroyed"}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <StatsCard
            icon="📦"
            label="Total"
            value={capsules.length}
            gradient="from-blue-500 via-blue-600 to-indigo-600"
          />
          <StatsCard
            icon="🔒"
            label="Locked"
            value={capsules.filter((c) => c.isLocked).length}
            gradient="from-purple-500 via-purple-600 to-indigo-600"
          />
          <StatsCard
            icon="🔓"
            label="Unlocked"
            value={capsules.filter((c) => !c.isLocked && !isExpiredForUser(c) && !isDestroyedForUser(c)).length}
            gradient="from-emerald-500 via-teal-500 to-cyan-600"
          />
          <StatsCard
            icon="⏰"
            label="Expired"
            value={capsules.filter((c) => isExpiredForUser(c)).length}
            gradient="from-amber-500 via-orange-500 to-red-500"
          />
          <StatsCard
            icon="💥"
            label="Destroyed"
            value={capsules.filter((c) => isDestroyedForUser(c)).length}
            gradient="from-rose-500 via-pink-500 to-fuchsia-600"
          />
        </motion.div>

        {/* Capsules Grid */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-pink-500/20 rounded-full flex items-center justify-center text-6xl backdrop-blur-sm border border-white/10">
              📭
            </div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">No capsules found</h3>
            <p className="text-gray-400 mb-6">
              {query ? "Try a different search term" : "Create your first time capsule to get started"}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard/create")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-full font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
            >
              ✨ Create Your First Capsule
            </motion.button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((c, i) => {
              const g = gradients[i % gradients.length];
              return (
                <CapsuleCard
                  key={c._id}
                  capsule={c}
                  gradient={g}
                  index={i}
                  getTimeLeft={getTimeLeft}
                  currentUserEmail={email}
                  currentUserId={localStorage.getItem("userId")}
                  onDelete={async () => {
                    if (!confirm("Delete this capsule permanently?")) return;

                    const token = localStorage.getItem("token");
                    await fetch(`${API_URL}/api/capsules/${c._id}`, {
                      method: "DELETE",
                      headers: { Authorization: token || "" },
                    });

                    setCapsules((prev) => prev.filter((x) => x._id !== c._id));
                  }}
                  onClick={() => router.push(`/dashboard/capsule/${c._id}`)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style> */}
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function StatsCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: string;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl hover:shadow-2xl transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function CapsuleCard({
  capsule,
  gradient,
  index,
  getTimeLeft,
  currentUserEmail,
  currentUserId,
  onDelete,
  onClick,
}: any) {
  // Force re-render every second for countdown
  const [tick, setTick] = useState(0);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  
  useEffect(() => {
    if (capsule.isLocked && capsule.unlockAt) {
      // Update timeLeft immediately
      setTimeLeft(getTimeLeft(capsule.unlockAt));
      
      const interval = setInterval(() => {
        setTick(t => t + 1);
        // Recalculate timeLeft on every tick
        setTimeLeft(getTimeLeft(capsule.unlockAt));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [capsule.isLocked, capsule.unlockAt, getTimeLeft]);

  // Determine user role
  const isOwner = capsule.owner === currentUserId;
  const isContributor = capsule.contributors?.includes(currentUserId);
  const isRecipient = capsule.recipients?.includes(currentUserEmail);
  
  let userRole = "";
  let roleColor = "";
  if (isOwner) {
    userRole = "👑 Owner";
    roleColor = "text-yellow-400";
  } else if (isContributor) {
    userRole = "👥 Collaborator";
    roleColor = "text-blue-400";
  } else if (isRecipient) {
    userRole = "📧 Recipient";
    roleColor = "text-purple-400";
  }

  // Recipients can't delete capsules, and can't access locked capsules
  const canDelete = isOwner;
  const canAccess = isOwner || isContributor || (isRecipient && !capsule.isLocked);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95 group-hover:opacity-100 transition-opacity`} />
      
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      {/* Content */}
      <div className="relative p-6 bg-slate-900/50 backdrop-blur-md min-h-70 flex flex-col justify-between border border-white/10 rounded-2xl">
        {/* Top Section */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex-1 leading-tight">
              {capsule.title}
            </h3>
            {capsule.isLocked && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/30 border border-red-300/50 text-white text-xs font-bold backdrop-blur-md shadow-lg">
                🔒 Locked
              </span>
            )}
            {!capsule.isLocked && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-300/50 text-white text-xs font-bold backdrop-blur-md shadow-lg">
                🔓 Open
              </span>
            )}
          </div>

          <p className="text-white/90 font-medium mb-2">{capsule.theme}</p>
          
          {/* User Role */}
          {userRole && (
            <div className="mb-4">
              <span className={`text-xs font-semibold ${roleColor}`}>
                {userRole}
              </span>
            </div>
          )}

          {/* Countdown */}
          {timeLeft && (
            <div className="mb-4 p-4 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 shadow-lg">
              <p className="text-xs text-white/90 mb-2 font-semibold">⏰ Unlocks in:</p>
              <div className="flex gap-2 text-white font-bold justify-center">
                <div className="flex flex-col items-center bg-white/10 rounded-lg px-2 py-1">
                  <span className="text-2xl">{timeLeft.days}</span>
                  <span className="text-xs opacity-80">days</span>
                </div>
                <span className="text-2xl self-center">:</span>
                <div className="flex flex-col items-center bg-white/10 rounded-lg px-2 py-1">
                  <span className="text-2xl">{timeLeft.hours}</span>
                  <span className="text-xs opacity-80">hrs</span>
                </div>
                <span className="text-2xl self-center">:</span>
                <div className="flex flex-col items-center bg-white/10 rounded-lg px-2 py-1">
                  <span className="text-2xl">{timeLeft.minutes}</span>
                  <span className="text-xs opacity-80">min</span>
                </div>
                <span className="text-2xl self-center">:</span>
                <div className="flex flex-col items-center bg-white/10 rounded-lg px-2 py-1">
                  <span className="text-2xl">{timeLeft.seconds}</span>
                  <span className="text-xs opacity-80">sec</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/80">
              {capsule.isLocked
                ? `Unlocks: ${new Date(capsule.unlockAt).toLocaleDateString()}`
                : "🔓 Available now"}
            </p>
            <span className="text-sm px-3 py-1.5 rounded-full bg-white/25 text-white font-bold backdrop-blur-md shadow-md border border-white/30">
              {capsule.contributors?.length || 0} 👥
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Recipients can't access locked capsules */}
            {!canAccess ? (
              <div className="flex-1 text-center py-2 rounded-lg bg-gray-500/20 text-gray-400 text-sm font-medium backdrop-blur-sm border border-gray-500/20">
                🔒 Locked for Recipients
              </div>
            ) : (
              <>
                {/* Only owners and collaborators can edit */}
                {(isOwner || isContributor) && (
                  <Link
                    href={`/dashboard/edit/${capsule._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-center py-2.5 rounded-lg bg-white/25 hover:bg-white/35 text-white text-sm font-semibold transition-all backdrop-blur-md border border-white/30 shadow-md hover:shadow-lg"
                  >
                    ✏️ Edit
                  </Link>
                )}

                {/* Only owners can delete */}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-white text-sm font-semibold transition-all backdrop-blur-md border border-red-300/50 shadow-md hover:shadow-lg"
                  >
                    🗑️ Delete
                  </button>
                )}

                {/* Recipients get a different button */}
                {isRecipient && !isOwner && !isContributor && (
                  <div className="flex-1 text-center py-2.5 rounded-lg bg-purple-500/30 text-white text-sm font-semibold backdrop-blur-md border border-purple-300/50 shadow-md">
                    📧 View Only
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      {/* Border Glow on Hover */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-white/20 transition-all pointer-events-none"></div>
    </motion.div>
  );
}