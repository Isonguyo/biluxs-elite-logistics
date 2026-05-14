import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AnimatePresence mode="wait">
      <motion.div key={path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {children}
      </motion.div>
      {/* Shutter wipe overlay */}
      <motion.div
        key={`wipe-${path}`}
        className="fixed inset-0 z-[150] pointer-events-none origin-bottom"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        style={{ background: "linear-gradient(180deg, var(--crimson) 0%, var(--navy-deep) 100%)" }}
      />
    </AnimatePresence>
  );
}
