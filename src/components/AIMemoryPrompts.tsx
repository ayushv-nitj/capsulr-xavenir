"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

interface Prompt {
  title: string;
  description: string;
  icon: string;
  suggestedTheme: string;
}

interface AIMemoryPromptsProps {
  onSelectPrompt: (prompt: Prompt) => void;
}

export default function AIMemoryPrompts({ onSelectPrompt }: AIMemoryPromptsProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/prompts`, {
        headers: {
          Authorization: token || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={fetchPrompts}
        disabled={loading}
        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-violet-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span className="text-xl">✨</span>
        <span>{loading ? "Generating Ideas..." : "Get AI Memory Prompts"}</span>
      </motion.button>

      {/* Prompts Panel */}
      <AnimatePresence>
        {isOpen && prompts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>💡</span>
                  <span>Personalized Ideas for You</span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {prompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      onSelectPrompt(prompt);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-white/5 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{prompt.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white group-hover:text-purple-300 transition">
                          {prompt.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {prompt.description}
                        </p>
                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                          {prompt.suggestedTheme}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={fetchPrompts}
                disabled={loading}
                className="w-full mt-4 py-2 text-sm text-purple-300 hover:text-purple-200 transition disabled:opacity-50"
              >
                🔄 Generate New Ideas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
