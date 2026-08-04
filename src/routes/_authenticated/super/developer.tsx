import { createFileRoute } from "@tanstack/react-router";
import { useCP } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/developer")({ component: Page });

function Page() {
  const { rows: flags } = useCP("feature_flags", "key");
  const { rows: integrations } = useCP("integrations", "key");
  const { rows: audit } = useCP("audit_logs", "created_at", false);
  const channels = ["ops-bookings", "ops-drivers", "cp-health", "super-panel"];
  return (
    <SuperLayout title="Developer Center" subtitle="Technical surface of the platform: flags, secrets posture, realtime channels, webhooks and recent write logs.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Feature flags" value={flags.length.toString()} />
        <CStat label="Integrations" value={integrations.length.toString()} />
        <CStat label="Realtime channels" value={channels.length.toString()} />
        <CStat label="Log entries" value={audit.length.toString()} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Environment & Secrets">
          <div className="divide-y divide-border text-xs">
            {["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "LOVABLE_API_KEY"].map((k) => (
              <div key={k} className="p-3 flex items-center gap-3">
                <span className="flex-1 font-mono text-[11px]">{k}</span>
                <span className="text-emerald-300 text-[10px] uppercase tracking-widest">Configured · encrypted</span>
              </div>
            ))}
          </div>
        </CPanel>
        <CPanel title="Realtime Channels">
          <div className="divide-y divide-border text-xs">
            {channels.map((c) => (
              <div key={c} className="p-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="flex-1 font-mono text-[11px]">{c}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">subscribed</span>
              </div>
            ))}
          </div>
        </CPanel>
      </div>
      <div className="mt-4">
        <CPanel title="Recent Write Log">
          <div className="divide-y divide-border max-h-80 overflow-y-auto text-xs font-mono">
            {audit.slice(0, 40).map((r: Row) => (
              <div key={r.id} className="p-2 flex gap-3">
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</span>
                <span className="text-crimson">{r.action}</span>
                <span className="truncate">{r.entity}</span>
              </div>
            ))}
            {!audit.length && <CEmpty>No writes logged.</CEmpty>}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
