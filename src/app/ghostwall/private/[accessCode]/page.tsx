"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type GhostMessage = {
  _id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  reactions: { emoji: string; count: number }[];
};

type GhostWall = {
  _id: string;
  name: string;
  description?: string;
  type: string;
  accessCode: string;
  messages: GhostMessage[];
  settings: {
    messageLifetime: number;
    maxMessageLength: number;
    allowReactions: boolean;
  };
};

export default function PrivateGhostWallPage() {
  const { accessCode } = useParams();
  const router = useRouter();
  const [wall, setWall] = useState<GhostWall | null>(null);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWall();
  }, [accessCode]);

  const fetchWall = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/private/${accessCode}`);
      if (res.ok) {
        const data = await res.json();
        setWall(data);
      } else {
        setError("Wall not found or invalid access code");
      }
    } catch (err) {
      setError("Failed to load wall");
    } finally {
      setLoading(false);
    }
  };

  const postMessage = async () => {
    if (!message.trim() || !wall) return;

    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/${wall._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: message,
          accessCode: wall.accessCode 
        }),
      });

      if (res.ok) {
        setMessage("");
        await fetchWall();
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setPosting(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!wall) return;

    try {
      await fetch(`${API_URL}/api/ghostwalls/${wall._id}/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          emoji,
          accessCode: wall.accessCode 
        }),
      });

      await fetchWall();
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !wall) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/ghostwall")}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold"
          >
            Go to Public Walls
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                {wall.name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
                🔒 Private
              </span>
            </div>
            {wall.description && <p className="text-gray-400">{wall.description}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/ghostwall")}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
          >
            Public Walls
          </motion.button>
        </div>

        {/* Wall Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex gap-4 text-sm text-gray-300">
            <span>📝 {wall.messages.length} messages</span>
            <span>⏱️ {wall.settings.messageLifetime}h lifetime</span>
            <span>📏 Max {wall.settings.maxMessageLength} chars</span>
          </div>
        </motion.div>

        {/* Post Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">Post Anonymous Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts anonymously..."
            maxLength={wall.settings.maxMessageLength}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-400">
              {message.length}/{wall.settings.maxMessageLength}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={postMessage}
              disabled={!message.trim() || posting}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post Anonymously"}
            </motion.button>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="space-y-4">
          <AnimatePresence>
            {wall.messages.map((msg, index) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
              >
                <p className="text-white mb-4">{msg.content}</p>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {wall.settings.allowReactions && (
                      <>
                        {["❤️", "👍", "😂", "🔥", "👻"].map((emoji) => {
                          const reaction = msg.reactions.find((r) => r.emoji === emoji);
                          return (
                            <motion.button
                              key={emoji}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addReaction(msg._id, emoji)}
                              className="px-2 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-sm"
                            >
                              {emoji} {reaction && reaction.count > 0 ? reaction.count : ""}
                            </motion.button>
                          );
                        })}
                      </>
                    )}
                  </div>

                  <span className="text-xs text-gray-500">{getTimeRemaining(msg.expiresAt)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {wall.messages.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👻</div>
              <p className="text-gray-400">No messages yet. Be the first to post!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
