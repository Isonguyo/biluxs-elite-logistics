import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 backdrop-blur-md bg-[var(--navy-deep)]/80 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 gradient-brand grid place-items-center font-display text-white text-xl">
            B
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl tracking-widest text-white">BiLUXS</div>
            <div className="text-[10px] tracking-[0.3em] text-gold uppercase">Elite Logistics</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm tracking-widest uppercase">
          <a href="#about" className="hover:text-gold transition-colors">About</a>
          <a href="#services" className="hover:text-gold transition-colors">Services</a>
          <a href="#fleet" className="hover:text-gold transition-colors">Catalogue</a>
          <a href="#contact" className="hover:text-gold transition-colors">Contact</a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="#track" className="hidden sm:inline-flex items-center gap-2 px-4 h-10 border border-border text-xs uppercase tracking-widest hover:border-gold hover:text-gold transition-colors">
            <Search className="h-4 w-4" /> Track Order
          </a>
          <a href="#fleet" className="inline-flex items-center px-5 h-10 bg-crimson text-white text-xs uppercase tracking-widest press-effect">
            Catalogue
          </a>
          <button onClick={() => setOpen(!open)} className="md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border px-6 py-4 flex flex-col gap-3 text-sm uppercase tracking-widest">
          <a href="#about" onClick={() => setOpen(false)}>About</a>
          <a href="#services" onClick={() => setOpen(false)}>Services</a>
          <a href="#fleet" onClick={() => setOpen(false)}>Catalogue</a>
          <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
        </div>
      )}
    </motion.header>
  );
}
