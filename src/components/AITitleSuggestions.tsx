"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

interface AITitleSuggestionsProps {
  content: string;
  theme: string;
  onSelectTitle: (title: string) => void;
}

export default function AITitleSuggestions({ 
  content, 
  theme, 
  onSelectTitle 
}: AITitleSuggestionsProps) {
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generateTitles = async () => {
    if (!content || !theme) {
      alert("Please enter both content and theme first");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/titles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({ content, theme }),
      });

      if (res.ok) {
        const data = await res.json();
        setTitles(data.titles);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Failed to generate titles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={generateTitles}
        disabled={loading || !content || !theme}
        className="text-sm text-purple-300 hover:text-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <span>✨</span>
        <span>{loading ? "Generating..." : "Suggest Titles"}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && titles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="bg-slate-700/30 rounded-lg border border-white/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">AI Suggestions:</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {titles.map((title, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    type="button"
                    onClick={() => {
                      onSelectTitle(title);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded bg-slate-600/50 hover:bg-slate-600 text-sm text-white transition"
                  >
                    {title}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
