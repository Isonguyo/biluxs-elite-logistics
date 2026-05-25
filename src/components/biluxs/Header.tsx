import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Menu, X, LogOut, LayoutDashboard, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "./Logo";

// Grouping navigation into hierarchical links or submenus
const NAV_ITEMS = [
  { to: "/", label: "Home" },
  {
    label: "Services",
    children: [
      { to: "/services", label: "Overview" },
      { to: "/cargo", label: "Cargo Logistics" },
      { to: "/shopping", label: "Global Shopping" },
      { to: "/procurement", label: "Procurement" },
      { to: "/destinations", label: "Destinations" },
    ],
  },
  {
    label: "Company",
    children: [
      { to: "/about", label: "About Us" },
      { to: "/fleet", label: "Our Fleet" },
    ],
  },
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
        <Link to="/" className="flex items-center group">
          <Logo size={44} />
        </Link>

        {/* Desktop Navigation Row */}
        <nav className="hidden lg:flex items-center gap-8 text-xs tracking-widest uppercase h-full">
          {NAV_ITEMS.map((item, idx) => {
            // Render basic standard links
            if (!item.children) {
              return (
                <Link
                  key={idx}
                  to={item.to}
                  className="hover:text-gold transition-colors py-2"
                  activeProps={{ className: "text-gold" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              );
            }

            // Render interactive hover dropdown entries
            return (
              <div key={idx} className="relative group/dropdown h-full flex items-center cursor-pointer">
                <span className="flex items-center gap-1 hover:text-gold transition-colors py-2">
                  {item.label} <ChevronDown className="h-3 w-3 group-hover/dropdown:rotate-180 transition-transform duration-200" />
                </span>

                {/* Secret Dropdown Sheet */}
                <div className="absolute top-[calc(100%-8px)] left-0 w-52 bg-[var(--navy-deep)] border border-border py-3 shadow-xl rounded-sm opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 flex flex-col z-50">
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className="px-5 py-2.5 text-[11px] text-left hover:bg-white/5 hover:text-gold transition-colors normal-case tracking-wider"
                      activeProps={{ className: "text-gold bg-white/5" }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Action Buttons Container */}
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

      {/* Mobile Drawer Navigation Screen */}
      {open && (
        <div className="lg:hidden border-t border-border px-6 py-5 flex flex-col gap-4 text-sm uppercase tracking-widest bg-[var(--navy-deep)] max-h-[calc(100vh-80px)] overflow-y-auto">
          {NAV_ITEMS.map((item, idx) => {
            if (!item.children) {
              return (
                <Link key={idx} to={item.to} onClick={() => setOpen(false)} className="hover:text-gold py-1">
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={idx} className="flex flex-col gap-2 pl-0 py-1">
                <span className="text-gray-400 text-xs font-semibold border-b border-white/5 pb-1 mb-1">{item.label}</span>
                {item.children.map((child) => (
                  <Link key={child.to} to={child.to} onClick={() => setOpen(false)} className="hover:text-gold pl-3 py-1 text-xs">
                    {child.label}
                  </Link>
                ))}
              </div>
            );
          })}
          
          <div className="border-t border-white/10 my-2 pt-3 flex flex-col gap-4">
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
        </div>
      )}
    </motion.header>
  );
}