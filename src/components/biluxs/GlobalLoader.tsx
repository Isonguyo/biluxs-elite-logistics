import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";

type LoaderCtx = { ready: boolean };
const Ctx = createContext<LoaderCtx>({ ready: true });

/** Hero animations subscribe to this — they only run once loader is done. */
export function useLoaderReady() {
  return useContext(Ctx).ready;
}

const LOADER_MS = 1200;

export function LoaderProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setVisible(true);
    setReady(false);
    const t = setTimeout(() => {
      setVisible(false);
      // Give the exit transition a moment before hero fires.
      setTimeout(() => setReady(true), 250);
    }, LOADER_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <Ctx.Provider value={{ ready }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="biluxs-global-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="fixed inset-0 z-[300] grid place-items-center bg-[var(--navy-deep)]"
          >
            {/* Radial vignette */}
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(212,175,55,0.10) 0%, transparent 60%)",
              }}
            />
            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto"
              >
                <Logo size={72} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6 font-display text-3xl tracking-[0.35em] text-white"
              >
                Bi<span className="gradient-text">LUXS</span>
              </motion.div>
              <div className="mt-6 mx-auto h-[2px] w-56 bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: LOADER_MS / 1000, ease: "easeInOut" }}
                  className="h-full w-1/2 gradient-brand"
                />
              </div>
              <div className="mt-4 text-[10px] tracking-[0.4em] text-gold uppercase">
                Elite Logistics · Preparing Experience
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </Ctx.Provider>
  );
}
