import { createFileRoute } from "@tanstack/react-router";
import { useCP, usePlatformHealth } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/api")({ component: Page });

function Page() {
  const health = usePlatformHealth();
  const { rows: bookings } = useTable("bookings", { limit: 1000 });
  const { rows: audit } = useCP("audit_logs", "created_at", false);
  const day = 86400000;
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const start = Date.now() - (6 - i) * day;
    const label = new Date(start).toLocaleDateString("en", { weekday: "short" });
    const writes = [...bookings, ...audit].filter((r: Row) => {
      const t = new Date(r.created_at).getTime();
      return t >= start - day / 2 && t < start + day / 2;
    }).length;
    return { label, writes };
  });
  const peak = Math.max(1, ...buckets.map((b) => b.writes));
  return (
    <SuperLayout title="API Monitoring" subtitle="Request health, latency and write volume across the platform's data API.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Status" value={health.api} tone={health.api === "operational" ? "good" : "bad"} />
        <CStat label="Latency" value={`${health.latency}ms`} tone={health.latency < 400 ? "good" : "warn"} hint="Live probe" />
        <CStat label="Success rate" value={health.api === "operational" ? "100%" : "degraded"} />
        <CStat label="Writes (7 days)" value={buckets.reduce((a, b) => a + b.writes, 0).toString()} />
      </div>
      <CPanel title="Write Volume · Last 7 Days">
        <div className="p-6 flex items-end gap-3 h-56">
          {buckets.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-crimson/70" style={{ height: `${(b.writes / peak) * 100}%`, minHeight: 2 }} />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </CPanel>
      <div className="mt-4">
        <CPanel title="Top Endpoints">
          <div className="divide-y divide-border text-xs">
            {[["/bookings", bookings.length], ["/audit_logs", audit.length]].map(([k, v]) => (
              <div key={String(k)} className="p-3 flex items-center gap-3">
                <span className="flex-1">{k}</span>
                <span className="text-muted-foreground">{String(v)} rows served</span>
              </div>
            ))}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
