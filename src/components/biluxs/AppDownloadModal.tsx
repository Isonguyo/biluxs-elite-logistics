import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { X, Smartphone, MapPin, Apple } from "lucide-react";

export function AppDownloadModal({ open, onClose, waybill }: { open: boolean; onClose: () => void; waybill?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] grid place-items-center p-6"
          style={{ background: "oklch(0.10 0.04 270 / 0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg glass-blur border border-gold/40 p-8"
            style={{ boxShadow: "var(--shadow-elite)" }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 grid place-items-center border border-border hover:border-crimson hover:text-crimson transition-colors">
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="h-16 w-16 grid place-items-center bg-gradient-to-br from-gold to-amber-400 text-[var(--navy-deep)] mx-auto"
            >
              <Smartphone className="h-8 w-8" />
            </motion.div>

            <div className="text-center mt-5">
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold">Booking Confirmed</div>
              {waybill && (
                <div className="font-display text-2xl tracking-widest mt-2 text-white">{waybill}</div>
              )}
              <h2 className="font-display text-3xl mt-3 text-white">Track on the BiLUXS App</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
                Download the app to track your luxury chauffeur live via GPS, with push alerts at pickup and arrival.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <a href="#" className="flex items-center gap-3 p-3 border border-border hover:border-gold transition-colors bg-[var(--navy-deep)]">
                <Apple className="h-8 w-8 text-white" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Download on the</div>
                  <div className="font-display text-base text-white">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 p-3 border border-border hover:border-gold transition-colors bg-[var(--navy-deep)]">
                <PlayIcon />
                <div className="text-left leading-tight">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Get it on</div>
                  <div className="font-display text-base text-white">Google Play</div>
                </div>
              </a>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold">
                <MapPin className="h-3 w-3" /> Live GPS · Push alerts · Offline waybill
              </div>
              <Link to="/dashboard" onClick={onClose} className="text-[10px] uppercase tracking-widest hover:text-gold">Skip →</Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
      <path d="M3 2v20l18-10L3 2z" fill="url(#g)" />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#c9a84c" />
          <stop offset="1" stopColor="#7a1f2a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
