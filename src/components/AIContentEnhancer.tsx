"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

interface Enhancement {
  suggestions: string[];
  recommendedTags: string[];
  unlockDateSuggestion: {
    duration: string;
    reason: string;
  };
  reflectionPrompts: string[];
  sentiment: string;
}

interface AIContentEnhancerProps {
  content: string;
  theme: string;
  onApplySuggestion?: (suggestion: string) => void;
}

export default function AIContentEnhancer({ 
  content, 
  theme,
  onApplySuggestion 
}: AIContentEnhancerProps) {
  const [enhancement, setEnhancement] = useState<Enhancement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const enhanceContent = async () => {
    if (!content || content.trim().length < 10) {
      alert("Please write at least 10 characters before enhancing");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/enhance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({ content, theme }),
      });

      if (res.ok) {
        const data = await res.json();
        setEnhancement(data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Failed to enhance content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-400";
      case "nostalgic": return "text-amber-400";
      case "hopeful": return "text-blue-400";
      default: return "text-gray-400";
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "😊";
      case "nostalgic": return "🌅";
      case "hopeful": return "🌟";
      default: return "💭";
    }
  };

  return (
    <div>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={enhanceContent}
        disabled={loading || !content || content.trim().length < 10}
        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>🤖</span>
        <span>{loading ? "Analyzing..." : "Enhance with AI"}</span>
      </motion.button>

      {/* Enhancement Panel */}
      <AnimatePresence>
        {isOpen && enhancement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>✨</span>
                <span>AI Insights</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Sentiment */}
            <div className="mb-4 p-3 rounded-lg bg-slate-700/50 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSentimentEmoji(enhancement.sentiment)}</span>
                <div>
                  <p className="text-xs text-gray-400">Detected Mood</p>
                  <p className={`font-medium capitalize ${getSentimentColor(enhancement.sentiment)}`}>
                    {enhancement.sentiment}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>Enhancement Suggestions</span>
              </h4>
              <div className="space-y-2">
                {enhancement.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-slate-700/30 border border-white/5 text-sm text-gray-300"
                  >
                    <p>{suggestion}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommended Tags */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <span>🏷️</span>
                <span>Recommended Tags</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {enhancement.recommendedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Unlock Date Suggestion */}
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/20">
              <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span>📅</span>
                <span>Suggested Unlock Time</span>
              </h4>
              <p className="text-indigo-300 font-medium">{enhancement.unlockDateSuggestion.duration}</p>
              <p className="text-xs text-gray-400 mt-1">{enhancement.unlockDateSuggestion.reason}</p>
            </div>

            {/* Reflection Prompts */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <span>🤔</span>
                <span>Reflection Questions</span>
              </h4>
              <div className="space-y-2">
                {enhancement.reflectionPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-slate-700/30 border border-white/5 text-sm text-gray-300 italic"
                  >
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
