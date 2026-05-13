import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Menu, X, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/fleet", label: "Fleet" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 backdrop-blur-md bg-[var(--navy-deep)]/85 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 gradient-brand grid place-items-center font-display text-white text-xl">B</div>
          <div className="leading-none">
            <div className="font-display text-2xl tracking-widest text-white">BiLUXS</div>
            <div className="text-[10px] tracking-[0.3em] text-gold uppercase">Elite Logistics</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-xs tracking-widest uppercase">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="hover:text-gold transition-colors"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/track" className="hidden sm:inline-flex items-center gap-2 px-3 h-10 border border-border text-[10px] uppercase tracking-widest hover:border-gold hover:text-gold transition-colors">
            <Search className="h-4 w-4" /> Track
          </Link>
          <Link to="/book" className="inline-flex items-center px-4 h-10 bg-crimson text-white text-[10px] uppercase tracking-widest press-effect">
            Book Now
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hidden md:inline-flex h-10 w-10 items-center justify-center border border-border hover:border-gold transition-colors" title="Dashboard">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hidden md:inline-flex h-10 w-10 items-center justify-center border border-gold text-gold" title="Admin">
                  <ShieldCheck className="h-4 w-4" />
                </Link>
              )}
              <button onClick={handleSignOut} className="hidden md:inline-flex h-10 w-10 items-center justify-center border border-border hover:border-crimson hover:text-crimson transition-colors" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden md:inline-flex items-center px-4 h-10 border border-gold text-gold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)] transition-colors">
              Sign In
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="lg:hidden">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border px-6 py-5 flex flex-col gap-4 text-sm uppercase tracking-widest bg-[var(--navy-deep)]">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="hover:text-gold">{n.label}</Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="hover:text-gold">Dashboard</Link>
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="text-gold">Admin</Link>}
              <button onClick={handleSignOut} className="text-left text-crimson">Sign out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-gold">Sign in / Register</Link>
          )}
        </div>
      )}
    </motion.header>
  );
}
