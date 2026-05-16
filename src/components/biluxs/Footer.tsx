import { Instagram, Linkedin, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--navy-deep)]">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="mb-4"><Logo size={56} /></div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            A division of <span className="text-gold">Brightflow Conglomerate</span>. Tourism. Travel. Transport — delivered with first-class hospitality.
          </p>
          <div className="mt-4 text-[10px] tracking-[0.3em] uppercase text-gold italic">…Bringing the World to US</div>
        </div>

        <div>
          <h4 className="text-sm tracking-widest mb-4 text-gold">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/fleet" className="hover:text-foreground">Fleet Catalogue</Link></li>
            <li><Link to="/procurement" className="hover:text-foreground">Personal Procurement</Link></li>
            <li><Link to="/track" className="hover:text-foreground">Track Waybill</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm tracking-widest mb-4 text-gold">Fleet</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Executive Sedans</li>
            <li>Luxury SUVs</li>
            <li>VIP Shuttles</li>
            <li>Executive Coaches</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm tracking-widest mb-4 text-gold">Join the Elite List</h4>
          <p className="text-sm text-muted-foreground mb-3">Exclusive routes, fleet additions, and corporate offers.</p>
          <form className="flex" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 h-11 px-3 bg-input border border-border text-sm focus:outline-none focus:border-gold"
            />
            <button className="h-11 px-4 bg-crimson text-white text-xs uppercase tracking-widest press-effect">
              Join
            </button>
          </form>
          <div className="flex gap-3 mt-5">
            <a aria-label="WhatsApp" href="#" className="h-10 w-10 grid place-items-center border border-border hover:border-gold hover:text-gold transition-colors">
              <MessageCircle className="h-4 w-4" />
            </a>
            <a aria-label="Instagram" href="#" className="h-10 w-10 grid place-items-center border border-border hover:border-gold hover:text-gold transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a aria-label="LinkedIn" href="#" className="h-10 w-10 grid place-items-center border border-border hover:border-gold hover:text-gold transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} BiLUXS — A Brightflow Conglomerate company.</div>
        <div className="flex gap-6">
          <Link to="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
