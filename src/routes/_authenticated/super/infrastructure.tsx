import { createFileRoute } from "@tanstack/react-router";
import { useCP, usePlatformHealth } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/infrastructure")({ component: Page });

function Page() {
  const health = usePlatformHealth();
  const { rows: bookings } = useTable("bookings", { limit: 1000 });
  const { rows: incidents } = useTable("driver_incidents", { limit: 200 });
  const { rows: audit } = useCP("audit_logs", "created_at", false);
  return (
    <SuperLayout title="Disaster Recovery" subtitle="Backups, restore posture, storage, server health and incident history for the platform itself.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Database" value={health.db} tone={health.db === "operational" ? "good" : "bad"} hint="Continuous managed backups" />
        <CStat label="Realtime" value={health.realtime} tone={health.realtime === "operational" ? "good" : "warn"} />
        <CStat label="Records under protection" value={(bookings.length + audit.length).toString()} hint="Bookings + audit trail" />
        <CStat label="Incident history" value={incidents.length.toString()} tone={incidents.some((i: Row) => !i.resolved) ? "warn" : "neutral"} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Recovery Posture">
          <div className="divide-y divide-border text-xs">
            {[
              ["Automated daily backups", "Enabled · managed by Lovable Cloud"],
              ["Point-in-time restore", "Available on request from platform support"],
              ["Row Level Security", "Enforced on every table"],
              ["Audit immutability", "Update and delete revoked at the database"],
              ["Storage bucket", "procurement-refs · private, 10MB cap, MIME validated"],
            ].map(([k, v]) => (
              <div key={k} className="p-3 flex items-center gap-3">
                <span className="flex-1">{k}</span>
                <span className="text-muted-foreground text-right">{v}</span>
              </div>
            ))}
          </div>
        </CPanel>
        <CPanel title="Recent Incident History">
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {incidents.slice(0, 30).map((i: Row) => (
              <div key={i.id} className="p-3 text-xs flex items-center gap-3">
                <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 ${i.severity === "critical" ? "bg-crimson/20 text-crimson" : "bg-white/10 text-white/70"}`}>{i.severity}</span>
                <span className="flex-1 truncate">{i.kind} · {i.note ?? "—"}</span>
                <span className="text-[10px] text-muted-foreground">{since(i.created_at)}</span>
              </div>
            ))}
            {!incidents.length && <CEmpty>No incidents recorded.</CEmpty>}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
