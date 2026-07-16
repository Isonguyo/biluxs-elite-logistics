import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { Logo } from "./Logo";

export function OfflineOverlay() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const retry = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[400] grid place-items-center bg-[var(--navy-deep)]"
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(220,20,60,0.15) 0%, transparent 55%), radial-gradient(circle at 70% 70%, rgba(212,175,55,0.08) 0%, transparent 55%)",
            }}
          />
          <div className="relative max-w-md w-[90%] text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto"
            >
              <Logo size={64} />
            </motion.div>

            <div className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-crimson">
              <WifiOff className="h-3 w-3" /> Connection Lost
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl text-white tracking-widest">
              You're <span className="gradient-text">offline</span>
            </h1>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              We can't reach the BiLUXS network right now. Please check your internet
              connection — your journey resumes the moment you're back online.
            </p>

            <button
              onClick={retry}
              className="mt-8 inline-flex items-center gap-2 px-6 h-12 bg-crimson text-white text-xs uppercase tracking-widest press-effect"
            >
              <RefreshCw className="h-4 w-4" /> Retry Connection
            </button>

            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
              Waiting for signal
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
