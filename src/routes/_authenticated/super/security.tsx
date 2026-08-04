import { createFileRoute } from "@tanstack/react-router";
import { useCP, cpUpdate } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/security")({ component: Page });

function Page() {
  const { rows: events, reload } = useCP("security_events", "created_at", false);
  const { rows: profiles } = useCP("profiles", "full_name");
  const critical = events.filter((e: Row) => ["high", "critical"].includes(e.severity) && !e.resolved);
  return (
    <SuperLayout title="Security Center" subtitle="Suspicious logins, permission changes, lockouts and session hygiene across the platform.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Signals" value={events.length.toString()} />
        <CStat label="Unresolved critical" value={critical.length.toString()} tone={critical.length ? "bad" : "good"} />
        <CStat label="Suspended accounts" value={profiles.filter((p: Row) => p.suspended).length.toString()} tone="warn" />
        <CStat label="Failed logins" value={profiles.reduce((a: number, p: Row) => a + Number(p.failed_logins || 0), 0).toString()} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Security Signals">
          <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {events.map((e: Row) => (
              <div key={e.id} className="p-3 text-xs flex items-start gap-3">
                <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 ${e.severity === "high" || e.severity === "critical" ? "bg-crimson/20 text-crimson" : e.severity === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/70"}`}>{e.severity}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{e.kind.replace("_", " ")}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{e.detail}</div>
                  <div className="text-[10px] text-muted-foreground">{since(e.created_at)} · IP {e.ip_address ?? "internal"}</div>
                </div>
                {!e.resolved && (
                  <button onClick={async () => { await cpUpdate("security_events", { id: e.id }, { resolved: true }, e.kind); reload(); }}
                    className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-emerald-300">Resolve</button>
                )}
              </div>
            ))}
            {!events.length && <CEmpty>No security signals recorded.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="Account Posture">
          <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {profiles.map((p: Row) => (
              <div key={p.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{p.full_name ?? p.id.slice(0, 8)}</span>
                <span className="text-[10px] text-muted-foreground">last login {p.last_login_at ? since(p.last_login_at) : "never"}</span>
                <span className={p.suspended ? "text-crimson" : "text-emerald-300"}>{p.suspended ? "Suspended" : "Active"}</span>
              </div>
            ))}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
