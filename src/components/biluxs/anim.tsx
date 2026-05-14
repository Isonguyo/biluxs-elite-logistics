import { useEffect, useRef, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll, MotionProps } from "framer-motion";

/* -------- Scramble Text -------- */
const CHARS = "!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function ScrambleText({ text, duration = 1400, className = "" }: { text: string; duration?: number; className?: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    let frame = 0;
    const total = Math.round(duration / 30);
    const id = setInterval(() => {
      frame++;
      const progress = frame / total;
      const reveal = Math.floor(progress * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (i < reveal) s += text[i];
        else if (text[i] === " ") s += " ";
        else s += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setOut(s);
      if (frame >= total) { setOut(text); clearInterval(id); }
    }, 30);
    return () => clearInterval(id);
  }, [text, duration]);
  return <span className={className}>{out}</span>;
}

/* -------- Magnetic Button (wraps any element) -------- */
export function Magnetic({ children, strength = 0.35, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* -------- 3D Tilt Card -------- */
export function TiltCard({ children, className = "", max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 200, damping: 18 });
  const ry = useSpring(0, { stiffness: 200, damping: 18 });
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------- Reveal Lines (per-word stagger from a baseline) -------- */
export function RevealLines({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className} style={{ display: "inline-block" }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", marginRight: "0.25em" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* -------- Parallax Scroll Y -------- */
export function ParallaxY({ children, distance = 80, className = "" }: { children: ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return <motion.div ref={ref} style={{ y }} className={className}>{children}</motion.div>;
}

/* -------- Radar Pulse marker -------- */
export function RadarPulse({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-4 w-4 ${className}`}>
      <span className="absolute inset-0 rounded-full bg-crimson opacity-90" />
      <span className="absolute inset-0 rounded-full bg-crimson animate-ping" />
      <span className="absolute -inset-3 rounded-full border border-crimson/50 animate-[radar_2.4s_ease-out_infinite]" />
      <span className="absolute -inset-6 rounded-full border border-crimson/30 animate-[radar_2.4s_ease-out_infinite_0.6s]" />
    </span>
  );
}

/* -------- Ken Burns wrapper for an <img> -------- */
export function KenBurns({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <motion.img
      src={src}
      alt={alt}
      initial={{ scale: 1.08, x: -10, y: -6 }}
      animate={{ scale: 1.18, x: 10, y: 6 }}
      transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      className={className}
    />
  );
}

/* re-export motion for convenience */
export { motion };
export type { MotionProps };
