import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Loose row type — admin modules read across many tables. */
export type Row = Record<string, any>;

/** Generic realtime-aware table reader for the command center. */
export function useTable(
  table: string,
  opts: { order?: string; ascending?: boolean; limit?: number; realtime?: boolean } = {},
) {
  const { order = "created_at", ascending = false, limit = 500, realtime = true } = opts;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = (supabase as any).from(table).select("*").limit(limit);
    if (order) q = q.order(order, { ascending });
    const { data } = await q;
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [table, order, ascending, limit]);

  useEffect(() => {
    void load();
    if (!realtime) return;
    const ch = supabase
      .channel(rtTopic(`ops-${table}`))
      .on("postgres_changes", { event: "*", schema: "public", table }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, table, realtime]);

  return { rows, loading, reload: load };
}

/** Write an immutable audit trail entry for a staff action. */
export async function logAudit(action: string, entity: string, entityId?: string, detail?: string) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await (supabase as any).from("audit_logs").insert({
    actor_id: user.id,
    actor_name: (user.user_metadata as any)?.full_name ?? user.email ?? "Staff",
    action,
    entity,
    entity_id: entityId ?? null,
    detail: detail ?? null,
  });
}

export const naira = (n: number | string | null | undefined) =>
  `₦${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const since = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const inRange = (iso: string, from: Date, to?: Date) => {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && (!to || t < to.getTime());
};
