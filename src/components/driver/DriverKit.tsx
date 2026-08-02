import type { ReactNode } from "react";

export function Panel({ title, icon, children, tone = "gold", right }: {
  title?: string; icon?: ReactNode; children: ReactNode; tone?: "gold" | "crimson" | "plain"; right?: ReactNode;
}) {
  const border = tone === "crimson" ? "border-crimson/30" : tone === "plain" ? "border-border" : "border-gold/25";
  const text = tone === "crimson" ? "text-crimson" : "text-gold";
  return (
    <section className={`border ${border} bg-black/40`}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70">
          <div className={`text-[10px] uppercase tracking-[0.3em] ${text} inline-flex items-center gap-2`}>
            {icon}{title}
          </div>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: "gold" | "emerald" | "crimson" }) {
  const color = tone === "gold" ? "text-gold" : tone === "emerald" ? "text-emerald-400" : tone === "crimson" ? "text-crimson" : "text-white";
  return (
    <div className="border border-border bg-black/30 p-4">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl mt-2 ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function Btn({ children, onClick, tone = "outline", disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; tone?: "gold" | "crimson" | "emerald" | "outline"; disabled?: boolean; className?: string;
}) {
  const cls =
    tone === "gold" ? "bg-gold text-[var(--navy-deep)]"
    : tone === "crimson" ? "bg-crimson text-white"
    : tone === "emerald" ? "bg-emerald-500 text-white"
    : "border border-border hover:border-gold text-white";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`h-11 px-4 text-[10px] uppercase tracking-widest font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 transition-colors ${cls} ${className}`}>
      {children}
    </button>
  );
}
