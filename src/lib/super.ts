import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, type Row } from "@/lib/admin";

/** Generic control-plane table reader (no created_at assumption). */
export function useCP(table: string, order?: string, ascending = true) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = (supabase as any).from(table).select("*").limit(1000);
    if (order) q = q.order(order, { ascending });
    const { data } = await q;
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [table, order, ascending]);

  useEffect(() => { void load(); }, [load]);
  return { rows, loading, reload: load };
}

export async function cpUpdate(table: string, match: Row, patch: Row, label?: string) {
  const { error } = await (supabase as any).from(table).update(patch).match(match);
  if (!error) await logAudit("update", table, String(Object.values(match)[0] ?? ""), label ?? JSON.stringify(patch));
  return error;
}

export async function cpInsert(table: string, values: Row, label?: string) {
  const { error } = await (supabase as any).from(table).insert(values);
  if (!error) await logAudit("create", table, undefined, label);
  return error;
}

export async function cpDelete(table: string, match: Row, label?: string) {
  const { error } = await (supabase as any).from(table).delete().match(match);
  if (!error) await logAudit("delete", table, String(Object.values(match)[0] ?? ""), label);
  return error;
}

export async function logSecurity(kind: string, severity: string, detail: string, metadata: Row = {}) {
  const { data } = await supabase.auth.getUser();
  await (supabase as any).from("security_events").insert({
    kind, severity, detail, metadata,
    actor_id: data.user?.id ?? null,
    actor_name: (data.user?.user_metadata as any)?.full_name ?? data.user?.email ?? "System",
  });
}

/** Feature flags, consumable anywhere in the app. */
export function useFeatureFlags() {
  const { rows, loading, reload } = useCP("feature_flags", "label");
  const map = useMemo(() => {
    const m: Record<string, boolean> = {};
    rows.forEach((r) => { m[r.key] = !!r.enabled; });
    return m;
  }, [rows]);
  return { flags: rows, map, loading, reload, isOn: (k: string) => map[k] !== false };
}

/** Live platform health probe against the backend. */
export function usePlatformHealth() {
  const [health, setHealth] = useState<{ api: string; db: string; realtime: string; latency: number }>(
    { api: "checking", db: "checking", realtime: "checking", latency: 0 },
  );

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const t0 = performance.now();
      const { error } = await supabase.from("feature_flags").select("key").limit(1);
      const latency = Math.round(performance.now() - t0);
      if (!alive) return;
      setHealth((h) => ({ ...h, api: error ? "degraded" : "operational", db: error ? "degraded" : "operational", latency }));
      const ch = supabase.channel(rtTopic("cp-health");
      ch.subscribe((status) => {
        if (!alive) return;
        setHealth((h) => ({ ...h, realtime: status === "SUBSCRIBED" ? "operational" : status === "CHANNEL_ERROR" ? "degraded" : h.realtime }));
      });
      return () => { void supabase.removeChannel(ch); };
    };
    const cleanup = run();
    const t = setInterval(() => { void run(); }, 60000);
    return () => { alive = false; clearInterval(t); void cleanup; };
  }, []);

  return health;
}

export const pct = (n: number) => `${Number(n ?? 0).toFixed(1)}%`;
