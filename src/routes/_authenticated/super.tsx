import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, TrendingUp, Users, Shield, DollarSign, Trash2, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/biluxs/PageShell";

export const Route = createFileRoute("/_authenticated/super")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", s.session.user.id).eq("role", "super_user").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Super User Panel — BiLUXS" }] }),
  component: Page,
});

type Booking = { id: string; total_price: number; payment_status: string; created_at: string; luxury_protocol: boolean };
type Staff = { id: string; user_id: string; role: string; full_name: string | null };

function Page() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "driver" | "customer">("admin");

  const load = () => {
    supabase.from("bookings").select("id,total_price,payment_status,created_at,luxury_protocol")
      .then(({ data }) => setBookings((data as Booking[]) || []));
    supabase.from("user_roles").select("id,user_id,role, profiles!inner(full_name)" as never)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as { id: string; user_id: string; role: string; profiles: { full_name: string | null } }[];
        setStaff(rows.map((r) => ({ id: r.id, user_id: r.user_id, role: r.role, full_name: r.profiles?.full_name ?? null })));
      });
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("super")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const paid = bookings.filter((b) => b.payment_status === "paid");
  const revenue = paid.reduce((a, b) => a + Number(b.total_price), 0);
  const luxuryRevenue = paid.filter((b) => b.luxury_protocol).reduce((a, b) => a + Number(b.total_price), 0);
  const avgTicket = paid.length ? revenue / paid.length : 0;
  const conversion = bookings.length ? (paid.length / bookings.length) * 100 : 0;

  const grantRole = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    const { data: prof } = await supabase.from("profiles").select("id, full_name")
      .ilike("full_name" as never, `%${email}%` as never).limit(1).maybeSingle();
    // Fallback: allow raw uuid entry
    const targetId = prof?.id ?? email;
    const { error } = await supabase.from("user_roles").insert({ user_id: targetId, role: newRole as never });
    if (error) toast.error(error.message); else { toast.success(`Granted ${newRole}`); setNewEmail(""); }
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Role revoked");
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-[#05070f]">
        <div className="border-b border-crimson/30 bg-gradient-to-r from-[#0a0511] via-[var(--navy-deep)] to-[#0a0511]">
          <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-crimson">
                <Crown className="h-3 w-3" /> Restricted · Super User
              </div>
              <h1 className="font-display text-3xl md:text-4xl mt-1 tracking-widest">Master Control</h1>
            </div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Radio className="h-3 w-3 text-crimson animate-pulse" /> Sovereign Access
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={<DollarSign className="h-4 w-4" />} label="Gross Revenue" value={`₦${revenue.toLocaleString()}`} />
            <Kpi icon={<Crown className="h-4 w-4" />} label="Luxury Revenue" value={`₦${luxuryRevenue.toLocaleString()}`} accent />
            <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Avg Ticket" value={`₦${Math.round(avgTicket).toLocaleString()}`} />
            <Kpi icon={<Shield className="h-4 w-4" />} label="Conversion" value={`${conversion.toFixed(1)}%`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="border border-crimson/20 bg-black/40">
              <div className="p-4 border-b border-crimson/20 flex items-center gap-2">
                <Users className="h-4 w-4 text-crimson" />
                <div className="text-[10px] uppercase tracking-[0.3em] text-crimson">Staff Directory</div>
              </div>
              <div className="p-4 border-b border-border">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Grant Role</div>
                <div className="flex gap-2">
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user UUID or profile match"
                    className="flex-1 h-10 bg-input border border-border px-3 text-xs focus:outline-none focus:border-gold" />
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as never)}
                    className="h-10 bg-input border border-border px-2 text-xs">
                    <option value="admin">admin</option>
                    <option value="driver">driver</option>
                    <option value="customer">customer</option>
                  </select>
                  <button onClick={grantRole} className="h-10 px-4 bg-gold text-[var(--navy-deep)] text-[10px] uppercase tracking-widest font-semibold">Grant</button>
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                {staff.map((s) => (
                  <div key={s.id} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="text-white/90">{s.full_name || s.user_id.slice(0, 8)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.user_id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 h-6 inline-flex items-center text-[10px] uppercase tracking-widest ${
                        s.role === "super_user" ? "bg-crimson/20 text-crimson" :
                        s.role === "admin" ? "bg-gold/20 text-gold" :
                        s.role === "driver" ? "bg-emerald-500/20 text-emerald-300" :
                        "bg-muted text-foreground"
                      }`}>{s.role}</span>
                      {s.role !== "super_user" && (
                        <button onClick={() => revoke(s.id)} className="h-7 w-7 border border-border grid place-items-center hover:border-crimson hover:text-crimson">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!staff.length && <div className="p-8 text-xs text-muted-foreground text-center">No staff assigned.</div>}
              </div>
            </div>

            <div className="border border-gold/20 bg-black/40 p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Financial Analytics</div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Total transactions" value={paid.length.toString()} />
                <Row label="Pending checkouts" value={(bookings.length - paid.length).toString()} />
                <Row label="Luxury share" value={`${paid.length ? ((paid.filter((b) => b.luxury_protocol).length / paid.length) * 100).toFixed(1) : 0}%`} />
                <Row label="Estimated commission (10%)" value={`₦${Math.round(revenue * 0.1).toLocaleString()}`} />
                <Row label="Estimated net (90%)" value={`₦${Math.round(revenue * 0.9).toLocaleString()}`} accent />
              </div>
              <div className="mt-6 p-4 border border-gold/30 bg-gold/5 text-xs text-muted-foreground">
                Super User has unrestricted read/write access across all tenants, bookings and roles. Actions are audited via Supabase logs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-4 border ${accent ? "border-crimson bg-crimson/10" : "border-gold/20 bg-black/30"}`}>
      <div className={`flex items-center justify-between ${accent ? "text-crimson" : "text-gold"}`}>{icon}<span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span></div>
      <div className="font-display text-2xl mt-2">{value}</div>
    </div>
  );
}
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground text-xs uppercase tracking-widest">{label}</span>
      <span className={`font-display text-lg ${accent ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}
