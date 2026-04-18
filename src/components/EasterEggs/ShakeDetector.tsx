"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ShakeDetector() {
  const [show, setShow] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let shakeThreshold = 15;
    let shakes = 0;
    let lastShakeTime = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acceleration = e.accelerationIncludingGravity;
      if (!acceleration) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastShakeTime;

      if (timeDiff > 100) {
        const deltaX = Math.abs((acceleration.x || 0) - lastX);
        const deltaY = Math.abs((acceleration.y || 0) - lastY);
        const deltaZ = Math.abs((acceleration.z || 0) - lastZ);

        if (deltaX + deltaY + deltaZ > shakeThreshold) {
          shakes++;
          setShakeCount(shakes);
          lastShakeTime = currentTime;

          if (shakes >= 5) {
            setShow(true);
            shakes = 0;
            setShakeCount(0);

            // Create earthquake effect
            document.body.style.animation = "shake 0.5s";
            setTimeout(() => {
              document.body.style.animation = "";
            }, 500);

            setTimeout(() => setShow(false), 5000);
          }
        }

        lastX = acceleration.x || 0;
        lastY = acceleration.y || 0;
        lastZ = acceleration.z || 0;
      }
    };

    // Request permission for iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      (DeviceMotionEvent as any)
        .requestPermission()
        .then((permissionState: string) => {
          if (permissionState === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  // Fallback: Double-click anywhere for desktop users
  useEffect(() => {
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    const handleDoubleClick = () => {
      clickCount++;
      
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 500);

      if (clickCount === 5) {
        setShow(true);
        clickCount = 0;
        
        // Shake animation
        document.body.style.animation = "shake 0.5s";
        setTimeout(() => {
          document.body.style.animation = "";
        }, 500);

        setTimeout(() => setShow(false), 5000);
      }
    };

    window.addEventListener("click", handleDoubleClick);
    return () => {
      window.removeEventListener("click", handleDoubleClick);
      clearTimeout(clickTimer);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 10 }}
              className="relative"
            >
              {/* Earthquake waves */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-orange-500 rounded-full blur-3xl"
              />

              <div className="relative bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl">
                <div className="text-center">
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="text-7xl mb-4"
                  >
                    🌋
                  </motion.div>

                  <motion.h2
                    animate={{
                      x: [-2, 2, -2, 2, 0],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="text-4xl font-bold text-yellow-300 mb-2"
                  >
                    EARTHQUAKE!
                  </motion.h2>

                  <p className="text-xl text-white mb-4">
                    You shook things up!
                  </p>

                  <div className="bg-black/30 px-6 py-3 rounded-full mb-4">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                      XAVENIR 2K26
                    </p>
                    <p className="text-sm text-gray-200">Shake Master</p>
                  </div>

                  <p className="text-xs text-gray-300">
                    Easter Egg 4/5 Unlocked! 🥚
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {typeof DeviceMotionEvent !== "undefined" 
                      ? "Shake your device or click 5 times fast!"
                      : "Click anywhere 5 times fast!"}
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
