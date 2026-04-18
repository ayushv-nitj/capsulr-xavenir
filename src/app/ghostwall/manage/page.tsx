"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { motion } from "framer-motion";

type GhostWall = {
  _id: string;
  name: string;
  description?: string;
  type: "public" | "private";
  accessCode?: string;
  settings: {
    messageLifetime: number;
    maxMessageLength: number;
    allowReactions: boolean;
  };
  createdAt: string;
};

export default function ManageGhostWallsPage() {
  const router = useRouter();
  const [walls, setWalls] = useState<GhostWall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [messageLifetime, setMessageLifetime] = useState(24);
  const [maxMessageLength, setMaxMessageLength] = useState(500);
  const [allowReactions, setAllowReactions] = useState(true);
  const [creating, setCreating] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMyWalls();
  }, []);

  const fetchMyWalls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/my-walls`, {
        headers: { Authorization: token || "" },
      });
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

  const createWall = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/ghostwalls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({
          name,
          description,
          type,
          messageLifetime,
          maxMessageLength,
          allowReactions,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        resetForm();
        await fetchMyWalls();
      }
    } catch (err) {
      console.error("Failed to create wall:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteWall = async (wallId: string) => {
    if (!confirm("Delete this ghost wall permanently?")) return;

    try {
      await fetch(`${API_URL}/api/ghostwalls/${wallId}`, {
        method: "DELETE",
        headers: { Authorization: token || "" },
      });
      await fetchMyWalls();
    } catch (err) {
      console.error("Failed to delete wall:", err);
    }
  };

  const regenerateCode = async (wallId: string) => {
    if (!confirm("Regenerate access code? The old link will stop working.")) return;

    try {
      const res = await fetch(`${API_URL}/api/ghostwalls/${wallId}/regenerate-code`, {
        method: "POST",
        headers: { Authorization: token || "" },
      });

      if (res.ok) {
        await fetchMyWalls();
      }
    } catch (err) {
      console.error("Failed to regenerate code:", err);
    }
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setType("public");
    setMessageLifetime(24);
    setMaxMessageLength(500);
    setAllowReactions(true);
  };

  const getWallLink = (wall: GhostWall) => {
    if (wall.type === "public") {
      return `${window.location.origin}/ghostwall`;
    }
    return `${window.location.origin}/ghostwall/private/${wall.accessCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text mb-2">
              Manage Ghost Walls
            </h1>
            <p className="text-gray-400">Create and manage your anonymous message walls</p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold"
            >
              + Create Wall
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/ghostwall")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
            >
              View Public Walls
            </motion.button>
          </div>
        </div>

        {/* Walls List */}
        <div className="grid grid-cols-1 gap-6">
          {walls.map((wall) => (
            <motion.div
              key={wall._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{wall.name}</h3>
                  {wall.description && <p className="text-gray-400">{wall.description}</p>}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    wall.type === "public"
                      ? "bg-green-500/20 border border-green-400/30 text-green-300"
                      : "bg-purple-500/20 border border-purple-400/30 text-purple-300"
                  }`}
                >
                  {wall.type === "public" ? "🌍 Public" : "🔒 Private"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-gray-400 mb-1">Message Lifetime</div>
                  <div className="text-white font-semibold">{wall.settings.messageLifetime} hours</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-gray-400 mb-1">Max Length</div>
                  <div className="text-white font-semibold">{wall.settings.maxMessageLength} chars</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-gray-400 mb-1">Reactions</div>
                  <div className="text-white font-semibold">
                    {wall.settings.allowReactions ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>

              {wall.type === "private" && wall.accessCode && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-indigo-300 font-semibold">Access Link:</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => regenerateCode(wall._id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      🔄 Regenerate
                    </motion.button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getWallLink(wall)}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(getWallLink(wall), wall.accessCode!)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-sm"
                    >
                      {copiedCode === wall.accessCode ? "✓ Copied" : "Copy"}
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (wall.type === "public") {
                      router.push("/ghostwall");
                    } else {
                      router.push(`/ghostwall/private/${wall.accessCode}`);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                >
                  View Wall
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteWall(wall._id)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-xl font-semibold transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {walls.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👻</div>
            <p className="text-gray-400 text-lg mb-6">You haven't created any ghost walls yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold"
            >
              Create Your First Wall
            </motion.button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Create Ghost Wall</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Wall Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Campus Confessions"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this wall for?"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Wall Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType("public")}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      type === "public"
                        ? "border-green-500 bg-green-500/20 text-green-300"
                        : "border-white/10 bg-slate-800/50 text-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">🌍</div>
                    <div className="font-semibold">Public</div>
                    <div className="text-xs">Anyone can access</div>
                  </button>
                  <button
                    onClick={() => setType("private")}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      type === "private"
                        ? "border-purple-500 bg-purple-500/20 text-purple-300"
                        : "border-white/10 bg-slate-800/50 text-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">🔒</div>
                    <div className="font-semibold">Private</div>
                    <div className="text-xs">Link-based access</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Message Lifetime (hours)
                </label>
                <input
                  type="number"
                  value={messageLifetime}
                  onChange={(e) => setMessageLifetime(Number(e.target.value))}
                  min="1"
                  max="168"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Max Message Length (characters)
                </label>
                <input
                  type="number"
                  value={maxMessageLength}
                  onChange={(e) => setMaxMessageLength(Number(e.target.value))}
                  min="50"
                  max="2000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowReactions"
                  checked={allowReactions}
                  onChange={(e) => setAllowReactions(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-800/50 border-white/10"
                />
                <label htmlFor="allowReactions" className="text-sm font-semibold text-gray-300">
                  Allow reactions on messages
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createWall}
                disabled={!name.trim() || creating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Wall"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
