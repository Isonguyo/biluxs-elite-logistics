import { Header } from "./Header";
import { Footer } from "./Footer";
import { motion } from "framer-motion";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <section className="border-b border-border bg-[var(--navy-deep)]">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">{eyebrow}</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-white">{title}</h1>
        {subtitle && <p className="mt-5 text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  );
}
