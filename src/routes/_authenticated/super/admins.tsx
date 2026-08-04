import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, LogOut, ShieldOff, ShieldCheck, RefreshCw } from "lucide-react";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { listStaffAccounts, staffAction } from "@/lib/platform.functions";
import { useCP } from "@/lib/super";
import { supabase } from "@/integrations/supabase/client";
import { since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/admins")({ component: Page });

type Account = Awaited<ReturnType<typeof listStaffAccounts>>[number];

function Page() {
  const list = useServerFn(listStaffAccounts);
  const act = useServerFn(staffAction);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { rows: orgs } = useCP("organizations", "name");
  const { rows: audit } = useCP("audit_logs", "created_at", false);

  const load = async () => {
    try { setAccounts(await list({} as never)); setError(null); }
    catch (e: any) { setError(e?.message ?? "Unable to load accounts"); }
  };
  useEffect(() => { void load(); }, []);

  const run = async (userId: string, action: "suspend" | "reinstate" | "force_logout" | "reset_password") => {
    setBusy(userId + action);
    try {
      await act({ data: { userId, action } });
      toast.success(action === "reset_password" ? "Recovery link generated" : `Account ${action.replace("_", " ")}`);
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Action failed"); }
    setBusy(null);
  };

  const setOrg = async (userId: string, organization_id: string) => {
    await supabase.from("profiles").update({ organization_id: organization_id || null } as never).eq("id", userId);
    toast.success("Region assigned"); void load();
  };

  const staff = accounts.filter((a) => a.roles.some((r) => ["admin", "super_user", "driver"].includes(r)));
  const shown = accounts.filter((a) => !q || `${a.full_name} ${a.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <SuperLayout title="Admin Management" subtitle="Create, suspend, reset and audit every staff account on the platform — with last login, region assignment and an action trail."
      actions={<button onClick={load} className="h-9 px-3 border border-border text-[11px] uppercase tracking-widest inline-flex items-center gap-2 hover:border-crimson"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Accounts" value={accounts.length.toString()} />
        <CStat label="Staff" value={staff.length.toString()} />
        <CStat label="Suspended" value={accounts.filter((a) => a.suspended).length.toString()} tone="bad" />
        <CStat label="Unconfirmed" value={accounts.filter((a) => !a.confirmed).length.toString()} tone="warn" />
      </div>

      {error && <div className="mb-4 p-3 border border-crimson/40 bg-crimson/10 text-xs text-crimson">{error}</div>}

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <CPanel title="Accounts" action={
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts"
            className="h-8 px-2 bg-input border border-border text-xs outline-none focus:border-crimson w-52" />
        }>
          <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {shown.map((a) => (
              <div key={a.id} className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{a.full_name}
                      {a.suspended && <span className="ml-2 text-[9px] uppercase tracking-widest bg-crimson/20 text-crimson px-1.5 py-0.5">Suspended</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{a.email} · last login {a.last_sign_in_at ? since(a.last_sign_in_at) : "never"}</div>
                  </div>
                  <div className="hidden sm:flex gap-1">
                    {a.roles.map((r) => (
                      <span key={r} className="text-[9px] uppercase tracking-widest bg-white/10 px-1.5 py-0.5">{r.replace("_", " ")}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={a.organization_id ?? ""} onChange={(e) => setOrg(a.id, e.target.value)}
                    className="h-8 px-2 bg-input border border-border text-[11px] outline-none focus:border-crimson">
                    <option value="">No region</option>
                    {orgs.map((o: Row) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <button disabled={!!busy} onClick={() => run(a.id, a.suspended ? "reinstate" : "suspend")}
                    className="h-8 px-2 border border-border text-[10px] uppercase tracking-widest inline-flex items-center gap-1 hover:border-crimson">
                    {a.suspended ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                    {a.suspended ? "Reinstate" : "Suspend"}
                  </button>
                  <button disabled={!!busy} onClick={() => run(a.id, "force_logout")}
                    className="h-8 px-2 border border-border text-[10px] uppercase tracking-widest inline-flex items-center gap-1 hover:border-crimson">
                    <LogOut className="h-3 w-3" /> Force logout
                  </button>
                  <button disabled={!!busy} onClick={() => run(a.id, "reset_password")}
                    className="h-8 px-2 border border-border text-[10px] uppercase tracking-widest inline-flex items-center gap-1 hover:border-crimson">
                    <KeyRound className="h-3 w-3" /> Reset password
                  </button>
                </div>
              </div>
            ))}
            {!shown.length && <CEmpty>No accounts match.</CEmpty>}
          </div>
        </CPanel>

        <CPanel title="Activity Timeline">
          <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {audit.slice(0, 60).map((r: Row) => (
              <div key={r.id} className="p-3 text-xs">
                <div className="text-white/85 truncate">{r.actor_name ?? "Staff"} · {r.action}</div>
                <div className="text-[10px] text-muted-foreground truncate">{r.entity}{r.detail ? ` · ${r.detail}` : ""}</div>
                <div className="text-[10px] text-muted-foreground">{since(r.created_at)}</div>
              </div>
            ))}
            {!audit.length && <CEmpty>No activity recorded.</CEmpty>}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
