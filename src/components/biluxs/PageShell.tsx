import { Header } from "./Header";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { CustomCursor } from "./CustomCursor";
import { PageTransition } from "./PageTransition";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
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

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: React.ReactNode; title: React.ReactNode; subtitle?: string }) {
  return (
    <section className="border-b border-border bg-[var(--navy-deep)] relative overflow-hidden">
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-crimson/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">{eyebrow}</motion.div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-white">{title}</h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</motion.p>
        )}
      </div>
    </section>
  );
}
