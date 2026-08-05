import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, SectionTitle } from "@/components/portal/PortalLayout";
import { useProfile } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/settings")({
  head: () => ({ meta: [
    { title: "Settings — BiLUXS Member Portal" },
    { name: "description", content: "Security, password, appearance and notification preferences." },
    { property: "og:title", content: "Settings — BiLUXS" },
    { property: "og:description", content: "Security, password, appearance and notification preferences." },
  ] }),
  component: Page,
});

const CHANNELS: { key: string; label: string; hint: string }[] = [
  { key: "email", label: "Email", hint: "Receipts, confirmations and itineraries" },
  { key: "sms", label: "SMS", hint: "Chauffeur assignment and arrival alerts" },
  { key: "push", label: "In-app", hint: "Realtime trip and wallet updates" },
  { key: "whatsapp", label: "WhatsApp", hint: "Concierge and consultant messages" },
  { key: "marketing", label: "Offers & destinations", hint: "Curated travel offers from BiLUXS" },
];

function Page() {
  const { user, signOut } = useAuth();
  const { profile, reload } = useProfile();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setPrefs({ email: true, sms: true, push: true, ...(profile.notification_prefs ?? {}) });
  }, [profile]);

  const toggle = async (key: string) => {
    if (!user) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const { error } = await supabase.from("profiles").update({ notification_prefs: next }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    void reload();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("Use at least 8 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setPwd("");
    toast.success("Password updated");
  };

  const signOutEverywhere = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) { toast.error(error.message); return; }
    toast.success("Signed out on all devices");
  };

  return (
    <PortalLayout title="Settings" subtitle="Security, password, appearance and notification preferences.">
      <SectionTitle>Notification preferences</SectionTitle>
      <Card className="p-0 divide-y divide-border">
        {CHANNELS.map((c) => (
          <div key={c.key} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm">{c.label}</div>
              <div className="text-[11px] text-muted-foreground">{c.hint}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!prefs[c.key]}
              aria-label={`Toggle ${c.label} notifications`}
              onClick={() => toggle(c.key)}
              className={`h-6 w-11 rounded-full relative transition-colors ${prefs[c.key] ? "bg-gold" : "bg-white/15"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--navy-deep)] transition-all ${prefs[c.key] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </Card>

      <SectionTitle>Security</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Change password</div>
          <form onSubmit={changePassword} className="flex flex-col gap-3 max-w-sm">
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="New password"
              autoComplete="new-password"
              className="h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
            <button disabled={busy} className="h-11 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-50">
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </Card>

        <Card>
          <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Sessions</div>
          <div className="text-sm">{user?.email}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Last sign-in {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={signOutEverywhere} className="h-11 px-5 border border-border hover:border-gold text-[10px] uppercase tracking-widest">
              Sign out all devices
            </button>
            <button onClick={() => void signOut()} className="h-11 px-5 border border-crimson/60 text-crimson text-[10px] uppercase tracking-widest">
              Sign out
            </button>
          </div>
        </Card>
      </div>

      <SectionTitle>Privacy</SectionTitle>
      <Card>
        <p className="text-sm text-muted-foreground max-w-2xl">
          BiLUXS stores your travel documents and trip history securely and shares chauffeur-facing details only with the
          chauffeur assigned to your journey. Contact the concierge desk to request a full export or deletion of your data.
        </p>
      </Card>
    </PortalLayout>
  );
}
