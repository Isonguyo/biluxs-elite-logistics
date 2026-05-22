import { Header } from "./Header";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { CustomCursor } from "./CustomCursor";
import { PageTransition } from "./PageTransition";
import { SmoothScroll } from "./SmoothScroll";
import { ParallaxBg, FadeOutZoom, SplitText } from "./motion-fx";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SmoothScroll />
      <CustomCursor />
      <Header />
      <PageTransition>
        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </PageTransition>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  image?: string;
}) {
  // If title is a plain string, run it through SplitText. Otherwise render as-is.
  const titleNode =
    typeof title === "string" ? (
      <SplitText text={title} className="block" />
    ) : (
      title
    );

  return (
    <section className="relative border-b border-border bg-[var(--navy-deep)] overflow-hidden">
      {image && (
        <>
          <ParallaxBg speed={0.3}>
            <motion.img
              src={image}
              alt=""
              loading="eager"
              className="absolute inset-0 w-full h-[120%] object-cover"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1.22 }}
              transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
          </ParallaxBg>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.16 0.05 265 / 0.55) 0%, oklch(0.10 0.05 265 / 0.95) 100%)",
            }}
          />
          <div
            className="absolute inset-0 mix-blend-overlay opacity-40"
            style={{
              background:
                "linear-gradient(115deg, transparent 35%, var(--crimson) 75%, transparent 100%)",
            }}
          />
        </>
      )}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-crimson/20 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <FadeOutZoom>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4"
          >
            {eyebrow}
          </motion.div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            {titleNode}
          </h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-5 text-white/80 max-w-2xl leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}
        </FadeOutZoom>
      </div>
    </section>
  );
}
