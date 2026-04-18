"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MatrixRain() {
  const [activated, setActivated] = useState(false);
  const [show, setShow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [typedText, setTypedText] = useState("");
  const secretPhrase = "xavenir";

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      setTypedText((prev) => {
        const newText = (prev + e.key).toLowerCase().slice(-8);
        
        if (newText === secretPhrase) {
          setActivated(true);
          setShow(true);
          startMatrixRain();
          
          setTimeout(() => {
            setShow(false);
            setTypedText("");
          }, 8000);
        }
        
        return newText;
      });
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  const startMatrixRain = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "XAVENIR2K26CSE01アイウエオカキクケコサシスセソタチツテト";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    let animationId: number;

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    setTimeout(() => {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 8000);
  };

  return (
    <>
      {/* Hint indicator */}
      {typedText.length > 0 && typedText.length < secretPhrase.length && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-green-400 px-4 py-2 rounded-lg font-mono text-sm"
        >
          {typedText}{"_".repeat(secretPhrase.length - typedText.length)}
        </motion.div>
      )}

      <AnimatePresence>
        {show && (
          <>
            {/* Matrix rain canvas */}
            <canvas
              ref={canvasRef}
              className="fixed inset-0 z-40 pointer-events-none"
            />

            {/* Center message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="relative">
                {/* Glitch effect */}
                <motion.div
                  animate={{
                    x: [0, -2, 2, -2, 2, 0],
                    opacity: [1, 0.8, 1, 0.8, 1],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-2xl opacity-50"
                />

                <div className="relative bg-black border-4 border-green-500 p-10 rounded-2xl shadow-2xl">
                  <div className="text-center font-mono">
                    <motion.div
                      animate={{
                        textShadow: [
                          "0 0 10px #0f0",
                          "0 0 20px #0f0",
                          "0 0 10px #0f0",
                        ],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      className="text-6xl mb-4 text-green-400"
                    >
                      {"</>"}
                    </motion.div>
                    
                    <motion.h2
                      animate={{
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                      }}
                      className="text-4xl font-bold text-green-400 mb-2"
                    >
                      SYSTEM ACCESSED
                    </motion.h2>
                    
                    <p className="text-xl text-green-300 mb-4">
                      Welcome to the Matrix
                    </p>
                    
                    <div className="bg-green-900/30 border border-green-500 px-6 py-3 rounded mb-4">
                      <p className="text-2xl font-bold text-green-400">
                        XAVENIR 2K26
                      </p>
                      <p className="text-sm text-green-300">CSE Branch Fest</p>
                      <p className="text-xs text-green-500 mt-2">
                        {">"} Hacker Mode Activated
                      </p>
                    </div>
                    
                    <p className="text-xs text-green-600">
                      Easter Egg 3/5 Unlocked! 🥚
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
