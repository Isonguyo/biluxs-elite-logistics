import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setEnabled(true);
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      setHover(!!t?.closest("a, button, [role='button'], input, textarea, select, label"));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    document.body.style.cursor = "none";
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.body.style.cursor = "";
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed top-0 left-0 z-[200] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      >
        <motion.div
          animate={{ scale: hover ? 2.2 : 1, opacity: hover ? 0.9 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="h-9 w-9 rounded-full border border-gold grid place-items-center font-display text-[10px] tracking-widest text-gold"
        >
          B
        </motion.div>
      </motion.div>
      <motion.div
        style={{ x, y }}
        className="pointer-events-none fixed top-0 left-0 z-[200] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-gold" />
      </motion.div>
    </>
  );
}
