import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/support")({ component: Page });

function Page() {
  const { rows, reload } = useTable("contact_messages");
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const list = rows.filter((m: Row) => filter === "all" || (filter === "open" ? !m.is_read : m.is_read));

  const toggle = async (m: Row) => {
    const { error } = await (supabase as any).from("contact_messages")
      .update({ is_read: !m.is_read, read_at: !m.is_read ? new Date().toISOString() : null }).eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAudit(m.is_read ? "reopen_ticket" : "resolve_ticket", "contact_message", m.id, m.name);
    void reload();
  };

  return (
    <AdminLayout title="Support Center" subtitle="Inbound tickets from the contact desk — triage, resolve and track response time.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Tickets" value={rows.length.toString()} />
        <Stat label="Open" value={rows.filter((m) => !m.is_read).length.toString()} accent />
        <Stat label="Resolved" value={rows.filter((m) => m.is_read).length.toString()} />
        <Stat label="Newest" value={since(rows[0]?.created_at)} />
      </div>
      <Panel title="Tickets" action={
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
          className="h-8 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
          {["open", "resolved", "all"].map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      }>
        <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
          {list.map((m: Row) => (
            <div key={m.id} className={`p-4 ${!m.is_read ? "bg-gold/5" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm">{m.name}</div>
                    <Pill tone={m.is_read ? "good" : "warn"}>{m.is_read ? "resolved" : "open"}</Pill>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {m.email}{m.phone ? ` · ${m.phone}` : ""}{m.company ? ` · ${m.company}` : ""} · {since(m.created_at)}
                  </div>
                  <div className="text-xs text-white/80 mt-2 whitespace-pre-wrap">{m.message}</div>
                  <div className="flex gap-2 mt-3">
                    <a href={`mailto:${m.email}`} className="h-8 px-3 inline-flex items-center border border-border text-[10px] uppercase tracking-widest hover:border-gold">Reply by email</a>
                  </div>
                </div>
                <button onClick={() => toggle(m)} className={`h-8 w-8 grid place-items-center border ${m.is_read ? "border-border text-muted-foreground hover:border-gold" : "border-gold text-gold"}`}>
                  <Check className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {!list.length && <Empty>Nothing here.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
