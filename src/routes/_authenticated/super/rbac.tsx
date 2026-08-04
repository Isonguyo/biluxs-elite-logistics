import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useCP, cpInsert, cpDelete } from "@/lib/super";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/rbac")({ component: Page });

function Page() {
  const { rows: roles } = useCP("platform_roles", "sort_order");
  const { rows: perms } = useCP("permissions", "category");
  const { rows: rp, reload } = useCP("role_permissions");
  const { rows: upr, reload: reloadUpr } = useCP("user_platform_roles");
  const { rows: profiles } = useCP("profiles", "full_name");
  const [active, setActive] = useState<string | null>(null);
  const [assignUser, setAssignUser] = useState("");
  const [assignRole, setAssignRole] = useState("");

  const roleKey = active ?? roles[0]?.key ?? null;
  const granted = useMemo(() => new Set(rp.filter((r: Row) => r.role_key === roleKey).map((r: Row) => r.permission_key)), [rp, roleKey]);
  const byCategory = useMemo(() => {
    const m = new Map<string, Row[]>();
    perms.forEach((p: Row) => m.set(p.category, [...(m.get(p.category) ?? []), p]));
    return Array.from(m);
  }, [perms]);
  const nameOf = (id: string) => profiles.find((p: Row) => p.id === id)?.full_name ?? id.slice(0, 8);

  const togglePerm = async (permission_key: string) => {
    if (!roleKey) return;
    const err = granted.has(permission_key)
      ? await cpDelete("role_permissions", { role_key: roleKey, permission_key }, `${roleKey} ✕ ${permission_key}`)
      : await cpInsert("role_permissions", { role_key: roleKey, permission_key }, `${roleKey} + ${permission_key}`);
    if (err) return toast.error(err.message);
    reload();
  };

  const assign = async () => {
    if (!assignUser || !assignRole) return toast.error("Pick a person and a role");
    const err = await cpInsert("user_platform_roles", { user_id: assignUser, role_key: assignRole }, `${nameOf(assignUser)} → ${assignRole}`);
    if (err) return toast.error(err.message);
    toast.success("Role assigned"); setAssignUser(""); setAssignRole(""); reloadUpr();
  };

  const revoke = async (r: Row) => {
    const err = await cpDelete("user_platform_roles", { id: r.id }, `${nameOf(r.user_id)} ✕ ${r.role_key}`);
    if (err) return toast.error(err.message);
    reloadUpr();
  };

  const setCoreRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as never });
    if (error) return toast.error(error.message);
    toast.success(`Access tier → ${role.replace("_", " ")}`);
  };

  return (
    <SuperLayout title="Roles & Permissions" subtitle="Enterprise RBAC. Access tiers gate the dashboards; granular permissions decide what each role may actually do.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Roles" value={roles.length.toString()} />
        <CStat label="Permissions" value={perms.length.toString()} />
        <CStat label="Grants" value={rp.length.toString()} />
        <CStat label="Assignments" value={upr.length.toString()} />
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4 mb-4">
        <CPanel title="Roles">
          <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {roles.map((r: Row) => (
              <button key={r.key} onClick={() => setActive(r.key)}
                className={`w-full text-left p-3 hover:bg-white/[0.04] ${roleKey === r.key ? "bg-white/[0.06] text-crimson" : ""}`}>
                <div className="text-sm">{r.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{r.description}</div>
              </button>
            ))}
          </div>
        </CPanel>

        <CPanel title={`Permissions · ${roles.find((r: Row) => r.key === roleKey)?.label ?? "—"}`}>
          <div className="p-3 space-y-5 max-h-[520px] overflow-y-auto">
            {byCategory.map(([cat, list]) => (
              <div key={cat}>
                <div className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground mb-2">{cat}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {list.map((p: Row) => {
                    const on = granted.has(p.key);
                    return (
                      <button key={p.key} onClick={() => togglePerm(p.key)}
                        className={`text-left p-3 border transition-colors ${on ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-crimson/50"}`}>
                        <div className="text-xs">{p.label}</div>
                        <div className="text-[10px] text-muted-foreground">{p.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CPanel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Assign Enterprise Role">
          <div className="p-3 space-y-2">
            <select value={assignUser} onChange={(e) => setAssignUser(e.target.value)}
              className="h-9 w-full px-2 bg-input border border-border text-xs outline-none focus:border-crimson">
              <option value="">Select person…</option>
              {profiles.map((p: Row) => <option key={p.id} value={p.id}>{p.full_name ?? p.id.slice(0, 8)}</option>)}
            </select>
            <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}
              className="h-9 w-full px-2 bg-input border border-border text-xs outline-none focus:border-crimson">
              <option value="">Select role…</option>
              {roles.map((r: Row) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <button onClick={assign} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest">Assign</button>
            <div className="divide-y divide-border max-h-64 overflow-y-auto border border-border">
              {upr.map((r: Row) => (
                <div key={r.id} className="p-2 flex items-center gap-2 text-xs">
                  <span className="flex-1 truncate">{nameOf(r.user_id)}</span>
                  <span className="text-[10px] uppercase tracking-widest text-crimson">{r.role_key.replace("_", " ")}</span>
                  <button onClick={() => revoke(r)} className="text-[10px] uppercase text-muted-foreground hover:text-crimson">Revoke</button>
                </div>
              ))}
              {!upr.length && <CEmpty>No enterprise roles assigned.</CEmpty>}
            </div>
          </div>
        </CPanel>

        <CPanel title="Access Tier (Dashboard Gate)">
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {profiles.map((p: Row) => (
              <div key={p.id} className="p-3 flex items-center gap-3">
                <span className="flex-1 truncate text-sm">{p.full_name ?? p.id.slice(0, 8)}</span>
                <select defaultValue="" onChange={(e) => e.target.value && setCoreRole(p.id, e.target.value)}
                  className="h-8 px-2 bg-input border border-border text-[10px] uppercase tracking-widest outline-none focus:border-crimson">
                  <option value="">Change tier…</option>
                  {["super_user", "admin", "driver", "customer"].map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>
            ))}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
