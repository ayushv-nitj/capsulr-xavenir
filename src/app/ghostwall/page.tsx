"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  messages: GhostMessage[];
  settings: {
    messageLifetime: number;
    maxMessageLength: number;
    allowReactions: boolean;
  };
};

export default function PublicGhostWallPage() {
  const router = useRouter();
  const [walls, setWalls] = useState<GhostWall[]>([]);
  const [selectedWall, setSelectedWall] = useState<GhostWall | null>(null);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isLoggedIn = !!token;

  useEffect(() => {
    fetchPublicWalls();
  }, []);

  const fetchPublicWalls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/public`);
      if (res.ok) {
        const data = await res.json();
        setWalls(data);
      }
    } catch (err) {
      console.error("Failed to fetch walls:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallDetails = async (wallId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/public/${wallId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedWall(data);
      }
    } catch (err) {
      console.error("Failed to fetch wall details:", err);
    }
  };

  const postMessage = async () => {
    if (!message.trim() || !selectedWall) return;

    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/${selectedWall._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });

      if (res.ok) {
        setMessage("");
        await fetchWallDetails(selectedWall._id);
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setPosting(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!selectedWall) return;

    try {
      await fetch(`${API_URL}/api/ghostwalls/${selectedWall._id}/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      await fetchWallDetails(selectedWall._id);
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
        <div className="text-white text-xl">Loading Ghost Walls...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text mb-2">
              👻 Ghost Wall
            </h1>
            <p className="text-gray-400">Anonymous temporary messages that fade away</p>
          </div>

          <div className="flex gap-3">
            {isLoggedIn && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/ghostwall/manage")}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                Manage Walls
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold"
            >
              Back to Dashboard
            </motion.button>
          </div>
        </div>

        {!selectedWall ? (
          /* Wall List View */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {walls.map((wall) => (
                <motion.div
                  key={wall._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  onClick={() => fetchWallDetails(wall._id)}
                  className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-indigo-500/50 transition-all"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{wall.name}</h3>
                  {wall.description && (
                    <p className="text-gray-400 text-sm mb-4">{wall.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-indigo-400">Public Wall</span>
                    <span className="text-gray-500">Click to enter →</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {walls.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">👻</div>
                <p className="text-gray-400 text-lg">No public ghost walls yet</p>
                {isLoggedIn && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/ghostwall/manage")}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold"
                  >
                    Create First Wall
                  </motion.button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Wall Detail View */
          <div>
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => setSelectedWall(null)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Walls</span>
            </motion.button>

            {/* Wall Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6"
            >
              <h2 className="text-3xl font-bold text-white mb-2">{selectedWall.name}</h2>
              {selectedWall.description && (
                <p className="text-gray-400 mb-4">{selectedWall.description}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-400">
                <span>📝 {selectedWall.messages.length} messages</span>
                <span>⏱️ {selectedWall.settings.messageLifetime}h lifetime</span>
                <span>📏 Max {selectedWall.settings.maxMessageLength} chars</span>
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
                maxLength={selectedWall.settings.maxMessageLength}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-400">
                  {message.length}/{selectedWall.settings.maxMessageLength}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={postMessage}
                  disabled={!message.trim() || posting}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold disabled:opacity-50"
                >
                  {posting ? "Posting..." : "Post Anonymously"}
                </motion.button>
              </div>
            </motion.div>

            {/* Messages */}
            <div className="space-y-4">
              <AnimatePresence>
                {selectedWall.messages.map((msg, index) => (
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
                        {selectedWall.settings.allowReactions && (
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

              {selectedWall.messages.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">👻</div>
                  <p className="text-gray-400">No messages yet. Be the first to post!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
