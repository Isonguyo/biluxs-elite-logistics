import { Avatar } from "@/components/portal/Avatar";

/** Photo + name identity cell used across every admin surface. */
export function Ident({
  photo, name, sub, size = 32, className = "",
}: { photo?: string | null; name?: string | null; sub?: React.ReactNode; size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <Avatar value={photo} name={name} size={size} />
      <div className="min-w-0">
        <div className="text-xs text-white/90 truncate">{name ?? "—"}</div>
        {sub != null && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
      </div>
    </div>
  );
}
