"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null;

function getTimeLeft(unlockAt: string): TimeLeft {
  const diff = +new Date(unlockAt) - +new Date();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function RecipientView() {
  const { id, email } = useParams();
  const [capsule, setCapsule] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]); // Initialize as empty array
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/capsules/recipient/${id}/${email}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({ message: "Access denied" }));
          setError(data.message || "Access denied");
          return;
        }
        const data = await res.json();
        setCapsule(data);

        // View tracking now happens automatically in the backend GET request
        // No separate POST request needed - this eliminates the race condition

        // Only fetch memories if unlocked
        if (!data.isLocked) {
          try {
            const memRes = await fetch(`${API_URL}/api/capsules/recipient/${id}/${email}/memories`);
            if (memRes.ok) {
              const memData = await memRes.json();
              // Ensure memData is an array before setting it
              setMemories(Array.isArray(memData) ? memData : []);
            } else {
              console.warn('Failed to fetch memories:', memRes.status);
              setMemories([]);
            }
          } catch (memError) {
            console.error('Error fetching memories:', memError);
            setMemories([]);
          }
        } else {
          setMemories([]);
        }
      } catch (err) {
        console.error('Error fetching capsule:', err);
        setError("Failed to load capsule");
      } finally {
        setLoading(false);
      }
    };

    if (id && email) {
      fetchCapsule();
    }
  }, [id, email]); // Simplified dependencies - no more hasTrackedView

  useEffect(() => {
    if (!capsule?.unlockAt || !capsule?.isLocked) return;

    setTimeLeft(getTimeLeft(capsule.unlockAt));
    const interval = setInterval(() => {
      const tl = getTimeLeft(capsule.unlockAt);
      setTimeLeft(tl);
      
      // Refresh page when unlocked
      if (!tl) {
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [capsule]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    const isExpired = error.includes("expired");
    const isDestroyed = error.includes("viewed once") || error.includes("destroyed");
    
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className={`border rounded-2xl p-8 text-center ${
          isExpired ? "bg-orange-500/10 border-orange-500/30" :
          isDestroyed ? "bg-red-500/10 border-red-500/30" :
          "bg-red-500/10 border-red-500/30"
        }`}>
          <div className="text-6xl mb-4">
            {isExpired ? "⏰" : isDestroyed ? "💥" : "🔒"}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            isExpired ? "text-orange-400" :
            isDestroyed ? "text-red-400" :
            "text-red-400"
          }`}>
            {isExpired ? "Capsule Expired" : 
             isDestroyed ? "Capsule Destroyed" : 
             "Access Denied"}
          </h2>
          <p className="text-gray-400">{error}</p>
          {(isExpired || isDestroyed) && (
            <p className="text-gray-500 text-sm mt-4">
              This capsule is no longer accessible. Thank you for being part of this memory!
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Capsule not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text mb-2">
            {capsule.title}
          </h1>
          <p className="text-gray-400 text-lg mb-4">{capsule.theme}</p>
          
          {capsule.isLocked ? (
            <div className="flex items-center gap-2 text-red-400">
              <span>🔒</span>
              <span className="text-sm">This capsule is locked</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <span>🔓</span>
              <span className="text-sm">This capsule is unlocked</span>
            </div>
          )}
        </motion.div>

        {/* View Once Warning */}
        {capsule.isViewOnce && !capsule.isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-6 mb-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-red-300 font-bold text-lg mb-2">
              <span>🔥</span>
              <span>VIEW ONCE CAPSULE</span>
              <span>🔥</span>
            </div>
            <p className="text-red-200 font-semibold">
              ⚠️ This capsule will be DESTROYED after you view it once!
            </p>
            <p className="text-red-300 text-sm mt-2">
              Once you close this page or refresh, this capsule will no longer be accessible.
            </p>
          </motion.div>
        )}

        {/* Locked View */}
        {capsule.isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl">
              🔒
            </div>
            <h3 className="text-2xl font-bold mb-4">Capsule Locked</h3>
            <p className="text-gray-400 mb-6">
              This capsule will unlock on:<br />
              <strong className="text-white">
                {new Date(capsule.unlockAt).toLocaleString()}
              </strong>
            </p>

            {timeLeft ? (
              <>
                <p className="text-sm text-purple-400 mb-4">Time Remaining:</p>
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-4xl font-bold">{timeLeft.days}</div>
                    <div className="text-xs text-gray-400 uppercase">Days</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-4xl font-bold">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-400 uppercase">Hours</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-4xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-400 uppercase">Min</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-4xl font-bold">{timeLeft.seconds}</div>
                    <div className="text-xs text-gray-400 uppercase">Sec</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mt-6">
                <p className="text-emerald-400 font-semibold">🔓 Unlocking now...</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Unlocked Memories */}
        {!capsule.isLocked && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Memories</h2>
            {!Array.isArray(memories) || memories.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No memories in this capsule</p>
            ) : (
              memories.map((m) => (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                >
                  {m.type === "text" && (
                    <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: m.content }} />
                  )}
                  {m.type === "image" && (
                    <>
                      {m.caption && <p className="text-sm font-medium text-gray-300 mb-2">{m.caption}</p>}
                      <img src={m.content} className="rounded-xl max-h-96 w-full object-cover" alt="Memory" />
                    </>
                  )}
                  {m.type === "audio" && (
                    <>
                      {m.caption && <p className="text-sm font-medium text-gray-300 mb-2">{m.caption}</p>}
                      <audio controls className="w-full">
                        <source src={m.content} />
                      </audio>
                    </>
                  )}
                  {m.type === "video" && (
                    <>
                      {m.caption && <p className="text-sm font-medium text-gray-300 mb-2">{m.caption}</p>}
                      <video controls className="w-full rounded-xl">
                        <source src={m.content} />
                      </video>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}