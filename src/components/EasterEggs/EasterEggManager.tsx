"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KonamiCode from "./KonamiCode";
import SecretClickCounter from "./SecretClickCounter";
import MatrixRain from "./MatrixRain";
import ShakeDetector from "./ShakeDetector";
import TimeBasedEgg from "./TimeBasedEgg";

interface EasterEgg {
  id: string;
  name: string;
  icon: string;
  hint: string;
  unlocked: boolean;
}

export default function EasterEggManager() {
  const [eggs, setEggs] = useState<EasterEgg[]>([
    {
      id: "konami",
      name: "Konami Code",
      icon: "🎮",
      hint: "↑↑↓↓←→←→BA",
      unlocked: false,
    },
    {
      id: "clicks",
      name: "Perfect Aim",
      icon: "🎯",
      hint: "Click the target 10 times",
      unlocked: false,
    },
    {
      id: "matrix",
      name: "Matrix Mode",
      icon: "</>",
      hint: "Type 'xavenir'",
      unlocked: false,
    },
    {
      id: "shake",
      name: "Earthquake",
      icon: "🌋",
      hint: "Shake it up!",
      unlocked: false,
    },
    {
      id: "time",
      name: "Time Master",
      icon: "⏰",
      hint: "Visit at 20:26 or midnight",
      unlocked: false,
    },
  ]);

  const [showTracker, setShowTracker] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    // Load progress from localStorage
    const saved = localStorage.getItem("xavenir-easter-eggs");
    if (saved) {
      try {
        const savedEggs = JSON.parse(saved);
        setEggs(savedEggs);
      } catch (e) {
        console.error("Failed to load Easter egg progress");
      }
    }
  }, []);

  useEffect(() => {
    // Listen for Easter egg unlocks
    const handleUnlock = (e: CustomEvent) => {
      const eggId = e.detail.eggId;
      setEggs((prev) => {
        const updated = prev.map((egg) =>
          egg.id === eggId ? { ...egg, unlocked: true } : egg
        );
        localStorage.setItem("xavenir-easter-eggs", JSON.stringify(updated));
        
        // Check if all unlocked
        if (updated.every((egg) => egg.unlocked)) {
          setTimeout(() => setShowCongrats(true), 1000);
        }
        
        return updated;
      });
    };

    window.addEventListener("easter-egg-unlocked" as any, handleUnlock);
    return () =>
      window.removeEventListener("easter-egg-unlocked" as any, handleUnlock);
  }, []);

  const unlockedCount = eggs.filter((egg) => egg.unlocked).length;
  const progress = (unlockedCount / eggs.length) * 100;

  return (
    <>
      {/* All Easter Egg Components */}
      <KonamiCode />
      <SecretClickCounter />
      <MatrixRain />
      <ShakeDetector />
      <TimeBasedEgg />

      {/* Progress Tracker Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowTracker(!showTracker)}
        className="fixed top-4 right-4 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all"
        title="Easter Egg Progress"
      >
        <div className="relative">
          <span className="text-2xl">🥚</span>
          {unlockedCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {unlockedCount}
            </motion.span>
          )}
        </div>
      </motion.button>

      {/* Progress Tracker Panel */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 z-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-80 shadow-2xl"
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">
                  Easter Eggs
                </h3>
                <button
                  onClick={() => setShowTracker(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-400">
                XAVENIR 2K26 - CSE Branch Fest
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Progress</span>
                <span className="text-sm font-bold text-purple-400">
                  {unlockedCount}/{eggs.length}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
                />
              </div>
            </div>

            {/* Egg List */}
            <div className="space-y-3">
              {eggs.map((egg, index) => (
                <motion.div
                  key={egg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border transition-all ${
                    egg.unlocked
                      ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/50"
                      : "bg-slate-800/50 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-3xl ${
                        egg.unlocked ? "grayscale-0" : "grayscale opacity-50"
                      }`}
                    >
                      {egg.icon}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`font-semibold ${
                          egg.unlocked ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {egg.name}
                      </h4>
                      <p className="text-xs text-gray-400">{egg.hint}</p>
                    </div>
                    {egg.unlocked && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-2xl"
                      >
                        ✅
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Reset Button */}
            {unlockedCount > 0 && (
              <button
                onClick={() => {
                  localStorage.removeItem("xavenir-easter-eggs");
                  setEggs((prev) =>
                    prev.map((egg) => ({ ...egg, unlocked: false }))
                  );
                }}
                className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Reset Progress
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Congratulations Modal */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCongrats(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fireworks effect */}
              <motion.div
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-full blur-3xl"
              />

              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600 p-12 rounded-3xl border-4 border-yellow-300 shadow-2xl">
                <div className="text-center">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="text-9xl mb-4"
                  >
                    🏆
                  </motion.div>

                  <motion.h2
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                    className="text-5xl font-bold text-yellow-100 mb-4"
                  >
                    LEGENDARY!
                  </motion.h2>

                  <p className="text-2xl text-white mb-6">
                    You found all Easter Eggs!
                  </p>

                  <div className="bg-black/30 px-8 py-4 rounded-full mb-6">
                    <p className="text-4xl font-bold text-yellow-100 mb-2">
                      XAVENIR 2K26
                    </p>
                    <p className="text-lg text-yellow-200">
                      🎓 CSE Branch Fest Champion
                    </p>
                    <p className="text-sm text-yellow-300 mt-2">
                      Master Easter Egg Hunter
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    {eggs.map((egg) => (
                      <motion.span
                        key={egg.id}
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: Math.random(),
                        }}
                        className="text-3xl"
                      >
                        {egg.icon}
                      </motion.span>
                    ))}
                  </div>

                  <p className="text-sm text-yellow-200">
                    5/5 Easter Eggs Collected! 🥚🥚🥚🥚🥚
                  </p>

                  <button
                    onClick={() => setShowCongrats(false)}
                    className="mt-6 px-8 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-all shadow-lg"
                  >
                    Awesome!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
