"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TimeBasedEgg() {
  const [show, setShow] = useState(false);
  const [eggType, setEggType] = useState<"midnight" | "golden" | null>(null);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Midnight magic (00:00 - 00:05)
      if (hours === 0 && minutes < 5) {
        setEggType("midnight");
        setShow(true);
        setTimeout(() => setShow(false), 6000);
      }
      // Golden hour (20:26 - 20:27 for 2026)
      else if (hours === 20 && minutes === 26) {
        setEggType("golden");
        setShow(true);
        setTimeout(() => setShow(false), 6000);
      }
    };

    // Check immediately
    checkTime();

    // Check every 30 seconds
    const interval = setInterval(checkTime, 30000);

    return () => clearInterval(interval);
  }, []);

  const createStars = () => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      stars.push(
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
          }}
          className="fixed w-2 h-2 bg-yellow-300 rounded-full pointer-events-none"
          style={{
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
          }}
        />
      );
    }
    return stars;
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Background effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-black opacity-90" />

          {/* Stars */}
          {eggType === "midnight" && createStars()}

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -100 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative z-10"
          >
            {eggType === "midnight" ? (
              // Midnight Magic
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-3xl opacity-50"
                />

                <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-12 rounded-3xl border-4 border-blue-300 shadow-2xl">
                  <div className="text-center">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                      className="text-8xl mb-4"
                    >
                      🌙
                    </motion.div>

                    <motion.h2
                      animate={{
                        textShadow: [
                          "0 0 20px #60a5fa",
                          "0 0 40px #60a5fa",
                          "0 0 20px #60a5fa",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="text-5xl font-bold text-blue-300 mb-2"
                    >
                      MIDNIGHT MAGIC
                    </motion.h2>

                    <p className="text-xl text-white mb-4">
                      You discovered the secret hour!
                    </p>

                    <div className="bg-black/40 px-8 py-4 rounded-full mb-4">
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
                        XAVENIR 2K26
                      </p>
                      <p className="text-sm text-gray-300 mt-1">
                        Night Owl Achievement
                      </p>
                      <p className="text-xs text-blue-400 mt-2">
                        00:00 - The Witching Hour
                      </p>
                    </div>

                    <p className="text-xs text-gray-400">
                      Easter Egg 5/5 Unlocked! 🥚
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Golden Hour (20:26)
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 blur-3xl"
                />

                <div className="relative bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 p-12 rounded-3xl border-4 border-yellow-300 shadow-2xl">
                  <div className="text-center">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="text-8xl mb-4"
                    >
                      ⏰
                    </motion.div>

                    <motion.h2
                      animate={{
                        textShadow: [
                          "0 0 20px #fbbf24",
                          "0 0 40px #fbbf24",
                          "0 0 20px #fbbf24",
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                      className="text-5xl font-bold text-yellow-100 mb-2"
                    >
                      GOLDEN HOUR!
                    </motion.h2>

                    <p className="text-xl text-white mb-4">
                      Perfect timing at 20:26!
                    </p>

                    <div className="bg-black/30 px-8 py-4 rounded-full mb-4">
                      <p className="text-3xl font-bold text-yellow-100">
                        XAVENIR 2K26
                      </p>
                      <p className="text-sm text-yellow-200 mt-1">
                        Time Master Achievement
                      </p>
                      <p className="text-xs text-yellow-300 mt-2">
                        20:26 - The Perfect Moment
                      </p>
                    </div>

                    <p className="text-xs text-yellow-200">
                      Easter Egg 5/5 Unlocked! 🥚
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
