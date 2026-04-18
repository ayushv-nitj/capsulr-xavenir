"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SecretClickCounter() {
  const [clicks, setClicks] = useState(0);
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleLogoClick = (e: React.MouseEvent) => {
    const newClicks = clicks + 1;
    setClicks(newClicks);

    // Add particle effect
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setParticles((prev) => [...prev, { id: Date.now(), x, y }]);
    setTimeout(() => {
      setParticles((prev) => prev.slice(1));
    }, 1000);

    if (newClicks === 10) {
      setShow(true);
      setTimeout(() => {
        setShow(false);
        setClicks(0);
      }, 5000);
    }
  };

  return (
    <>
      {/* Hidden clickable logo */}
      <div
        onClick={handleLogoClick}
        className="fixed bottom-4 right-4 cursor-pointer z-40 group"
        title="Click me 10 times..."
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          className="relative"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all">
            <span className="text-2xl">🎯</span>
          </div>
          
          {/* Click counter hint */}
          {clicks > 0 && clicks < 10 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              {clicks}/10
            </motion.div>
          )}

          {/* Particle effects */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ scale: 1, opacity: 1, x: particle.x, y: particle.y }}
              animate={{
                scale: 0,
                opacity: 0,
                x: particle.x + (Math.random() - 0.5) * 100,
                y: particle.y - 50,
              }}
              transition={{ duration: 1 }}
              className="absolute w-2 h-2 bg-purple-400 rounded-full pointer-events-none"
            />
          ))}
        </motion.div>
      </div>

      {/* Easter egg reveal */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-10 rounded-3xl shadow-2xl border-4 border-yellow-300">
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="text-7xl mb-4"
                  >
                    🎯
                  </motion.div>
                  <h2 className="text-4xl font-bold text-yellow-300 mb-2">
                    PERFECT AIM!
                  </h2>
                  <p className="text-xl text-white mb-4">
                    You clicked 10 times!
                  </p>
                  <div className="bg-black/30 px-6 py-3 rounded-full mb-4">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                      XAVENIR 2K26
                    </p>
                    <p className="text-sm text-gray-200">Precision Master</p>
                  </div>
                  <p className="text-xs text-gray-300">
                    Easter Egg 2/5 Unlocked! 🥚
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
