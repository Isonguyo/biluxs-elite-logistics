import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, SectionTitle } from "@/components/portal/PortalLayout";
import { useProfile, tierOf } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  head: () => ({ meta: [
    { title: "Profile — BiLUXS Member Portal" },
    { name: "description", content: "Your personal details, travel documents and contact preferences." },
    { property: "og:title", content: "Profile — BiLUXS" },
    { property: "og:description", content: "Your personal details, travel documents and contact preferences." },
  ] }),
  component: Page,
});

type Form = {
  full_name: string; phone: string; avatar_url: string; passport_no: string; nationality: string;
  emergency_contact_name: string; emergency_contact_phone: string; preferred_vehicle: string;
  preferred_airport: string; language: string; travel_preferences: string;
};

const EMPTY: Form = {
  full_name: "", phone: "", avatar_url: "", passport_no: "", nationality: "",
  emergency_contact_name: "", emergency_contact_phone: "", preferred_vehicle: "",
  preferred_airport: "", language: "en", travel_preferences: "",
};

function Page() {
  const { user } = useAuth();
  const { profile, reload } = useProfile();
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "", phone: profile.phone ?? "", avatar_url: profile.avatar_url ?? "",
      passport_no: profile.passport_no ?? "", nationality: profile.nationality ?? "",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
      preferred_vehicle: profile.preferred_vehicle ?? "", preferred_airport: profile.preferred_airport ?? "",
      language: profile.language ?? "en", travel_preferences: profile.travel_preferences ?? "",
    });
  }, [profile]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    void reload();
  };

  const tier = tierOf(profile?.loyalty_points ?? 0);
  const initials = (form.full_name || user?.email || "B").slice(0, 2).toUpperCase();

  return (
    <PortalLayout title="Profile" subtitle="Your personal details, travel documents and contact preferences.">
      <Card className="flex flex-wrap items-center gap-5">
        <div className="h-20 w-20 border border-gold text-gold grid place-items-center overflow-hidden font-display text-2xl">
          {form.avatar_url ? <img src={form.avatar_url} alt="Member avatar" className="h-full w-full object-cover" /> : initials}
        </div>
        <div className="min-w-0">
          <div className="font-display text-2xl">{form.full_name || "BiLUXS Member"}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
          <div className="mt-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
            {tier.current.label} Member · {profile?.loyalty_points ?? 0} pts
          </div>
        </div>
      </Card>

      <SectionTitle>Personal details</SectionTitle>
      <form onSubmit={save}>
        <Card className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={form.full_name} onChange={set("full_name")} />
          <Field label="Phone" value={form.phone} onChange={set("phone")} />
          <Field label="Avatar image URL" value={form.avatar_url} onChange={set("avatar_url")} />
          <Field label="Nationality" value={form.nationality} onChange={set("nationality")} />
          <Field label="Passport number" value={form.passport_no} onChange={set("passport_no")} />
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Language</span>
            <select value={form.language} onChange={set("language")}
              className="mt-1 w-full h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
              <option value="pt">Portuguese</option>
            </select>
          </label>

          <div className="sm:col-span-2 border-t border-border pt-4 text-[9px] uppercase tracking-[0.3em] text-gold">Emergency contact</div>
          <Field label="Contact name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
          <Field label="Contact phone" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />

          <div className="sm:col-span-2 border-t border-border pt-4 text-[9px] uppercase tracking-[0.3em] text-gold">Travel preferences</div>
          <Field label="Preferred vehicle" value={form.preferred_vehicle} onChange={set("preferred_vehicle")} placeholder="Mercedes S-Class" />
          <Field label="Preferred airport" value={form.preferred_airport} onChange={set("preferred_airport")} placeholder="Lagos (LOS)" />
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes for your chauffeur & concierge</span>
            <textarea rows={3} value={form.travel_preferences} onChange={set("travel_preferences")}
              className="mt-1 w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-gold" />
          </label>

          <div className="sm:col-span-2">
            <button disabled={busy} type="submit"
              className="h-11 px-8 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-50">
              {busy ? "Saving…" : "Save profile"}
            </button>
          </div>
        </Card>
      </form>
    </PortalLayout>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="mt-1 w-full h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
    </label>
  );
}
