import { ReactNode, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  MotionProps,
  Variants,
} from "framer-motion";
import { usePointerFine } from "@/hooks/usePointerFine";

/* ---------- Split Text: per-character masked reveal ---------- */
export function SplitText({
  text,
  className = "",
  delay = 0,
  stagger = 0.03,
  as = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "div";
}) {
  const Tag = motion[as] as React.ElementType;
  const words = text.split(" ");
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span
          key={wi}
          aria-hidden="true"
          style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.28em" }}
        >
          {Array.from(word).map((ch, ci) => (
            <span
              key={ci}
              style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
            >
              <motion.span
                style={{ display: "inline-block", willChange: "transform" }}
                variants={{
                  hidden: { y: "115%", rotate: 8, opacity: 0 },
                  show: {
                    y: "0%",
                    rotate: 0,
                    opacity: 1,
                    transition: { duration: 0.8, type: "spring", stiffness: 100, damping: 14 },
                  },
                }}
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

/* ---------- Magnetic Button wrapper ---------- */
export function MagneticButton({
  children,
  className = "",
  strength = 0.5,
  radius = 120,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < radius + Math.max(r.width, r.height) / 2) {
      x.set(dx * strength);
      y.set(dy * strength);
    }
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y, display: "inline-block" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Parallax background (Y translate based on scroll) ---------- */
export function ParallaxBg({
  children,
  speed = 0.3,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  return (
    <div ref={ref} className={className} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <motion.div style={{ y, position: "absolute", inset: 0 }}>{children}</motion.div>
    </div>
  );
}

/* ---------- Fade-out zoom for hero content as user scrolls ---------- */
export function FadeOutZoom({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  return (
    <motion.div ref={ref} style={{ opacity, scale, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------- 3D Perspective Card Cascade ---------- */
const cascadeContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const cascadeItem: Variants = {
  hidden: { opacity: 0, y: 60, rotateX: -15, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 110, damping: 16, mass: 0.7 },
  },
};

export function CardCascade({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      variants={cascadeContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      style={{ perspective: 1200 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function CascadeItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={cascadeItem} style={{ transformStyle: "preserve-3d" }} className={className}>
      {children}
    </motion.div>
  );
}
