import { Instagram, Linkedin, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--navy-deep)]">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 gradient-brand grid place-items-center font-display text-white text-xl">B</div>
            <div className="font-display text-2xl tracking-widest">BiLUXS</div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A division of <span className="text-gold">Brightflow Conglomerate</span>. Tourism. Travel. Transport — delivered with first-class hospitality.
          </p>
        </div>

        <div>
          <h4 className="text-sm tracking-widest mb-4 text-gold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#about" className="hover:text-foreground">About</a></li>
            <li><a href="#services" className="hover:text-foreground">Services</a></li>
            <li><a href="#fleet" className="hover:text-foreground">Fleet Catalogue</a></li>
            <li><a href="#track" className="hover:text-foreground">Track Order</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm tracking-widest mb-4 text-gold">Fleet Categories</h4>
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
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
