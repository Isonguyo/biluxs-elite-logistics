import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plug } from "lucide-react";
import { SuperLayout, CPanel, CStat } from "@/components/super/SuperLayout";
import { useCP, cpUpdate } from "@/lib/super";
import { since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/integrations")({ component: Page });

const STATUSES = ["connected", "degraded", "not_configured", "disabled"];
const tone = (s: string) => s === "connected" ? "text-emerald-300 border-emerald-500/40"
  : s === "degraded" ? "text-amber-300 border-amber-500/40"
  : s === "disabled" ? "text-crimson border-crimson/40" : "text-muted-foreground border-border";

function Page() {
  const { rows, reload } = useCP("integrations", "category");

  const setStatus = async (r: Row, status: string) => {
    const err = await cpUpdate("integrations", { key: r.key }, { status, last_checked_at: new Date().toISOString() }, `${r.name} → ${status}`);
    if (err) return toast.error(err.message);
    toast.success(`${r.name} marked ${status.replace("_", " ")}`); reload();
  };

  const cats = Array.from(new Set(rows.map((r: Row) => r.category)));

  return (
    <SuperLayout title="Integration Center" subtitle="Every third-party dependency in one registry — payments, maps, messaging and AI. Credentials themselves stay in encrypted platform secrets.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Integrations" value={rows.length.toString()} />
        <CStat label="Connected" value={rows.filter((r) => r.status === "connected").length.toString()} tone="good" />
        <CStat label="Needs setup" value={rows.filter((r) => r.status === "not_configured").length.toString()} tone="warn" />
        <CStat label="Degraded" value={rows.filter((r) => r.status === "degraded").length.toString()} tone="bad" />
      </div>

      <div className="space-y-4">
        {cats.map((c) => (
          <CPanel key={c} title={c}>
            <div className="grid md:grid-cols-2 gap-px bg-crimson/10">
              {rows.filter((r: Row) => r.category === c).map((r: Row) => (
                <div key={r.key} className="p-4 bg-black/40 flex items-center gap-3">
                  <Plug className="h-4 w-4 text-crimson shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.notes}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">checked {since(r.last_checked_at)}</div>
                  </div>
                  <select value={r.status} onChange={(e) => setStatus(r, e.target.value)}
                    className={`h-8 px-2 bg-input border text-[10px] uppercase tracking-widest outline-none ${tone(r.status)}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </CPanel>
        ))}
      </div>
    </SuperLayout>
  );
}
