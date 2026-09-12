import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Globe,
  FileText,
  HeartPulse,
  Car,
  Plane,
  MessageSquare,
  Save,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, SectionTitle } from "@/components/portal/PortalLayout";
import { AvatarUpload } from "@/components/portal/AvatarUpload";
import { useProfile } from "@/lib/portal";
import { rideTier } from "@/lib/ride";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BiLUXS Member Portal" },
      {
        name: "description",
        content: "Your personal details, travel documents and contact preferences.",
      },
      { property: "og:title", content: "Profile — BiLUXS" },
      {
        property: "og:description",
        content: "Your personal details, travel documents and contact preferences.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Form = {
  full_name: string;
  phone: string;
  avatar_url: string;
  passport_no: string;
  nationality: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  preferred_vehicle: string;
  preferred_airport: string;
  language: string;
  travel_preferences: string;
};

const EMPTY: Form = {
  full_name: "",
  phone: "",
  avatar_url: "",
  passport_no: "",
  nationality: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  preferred_vehicle: "",
  preferred_airport: "",
  language: "en",
  travel_preferences: "",
};

function Page() {
  const { user } = useAuth();
  const { profile, reload } = useProfile();
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [rides, setRides] = useState(0);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      avatar_url: profile.avatar_url ?? "",
      passport_no: profile.passport_no ?? "",
      nationality: profile.nationality ?? "",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
      preferred_vehicle: profile.preferred_vehicle ?? "",
      preferred_airport: profile.preferred_airport ?? "",
      language: profile.language ?? "en",
      travel_preferences: profile.travel_preferences ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .then(({ count }) => setRides(count ?? 0));
  }, [user]);

  const set =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile successfully updated");
    void reload();
  };

  const savePhoto = async (next: string | null) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: next })
      .eq("id", user.id);
    if (error) {
      toast.error("We couldn't save your photo at this time.");
      return;
    }
    setForm((f) => ({ ...f, avatar_url: next ?? "" }));
    void reload();
  };

  const tier = rideTier(rides);

  return (
    <PortalLayout
      title="My Profile"
      subtitle="Manage your personal details, travel documents, and bespoke preferences."
    >
      <div className="space-y-8">
        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 flex flex-col sm:flex-row items-center sm:items-start gap-6 p-8">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <ShieldCheck className="w-48 h-48" />
            </div>

            <div className="shrink-0 relative z-10">
              <AvatarUpload
                value={form.avatar_url || null}
                name={form.full_name || user?.email}
                onChange={savePhoto}
              />
            </div>

            <div className="text-center sm:text-left z-10 flex-1">
              <div className="font-display text-3xl md:text-4xl text-white tracking-wide">
                {form.full_name || "BiLUXS Member"}
              </div>
              <div className="text-sm text-white/50 mt-1">{user?.email}</div>
              
              <div className="mt-6 inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-sm backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
                  {tier.current.label} Tier
                </span>
                <span className="text-white/20">|</span>
                <span className="text-[10px] uppercase tracking-widest text-white/70">
                  {rides} completed ride{rides === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Settings Form */}
        <form onSubmit={save} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SectionTitle>Personal Details</SectionTitle>
            <Card className="grid sm:grid-cols-2 gap-5 border-white/10 bg-[#0a0511]/50">
              <Field
                icon={<User />}
                label="Full name"
                value={form.full_name}
                onChange={set("full_name")}
              />
              <Field
                icon={<Phone />}
                label="Phone"
                value={form.phone}
                onChange={set("phone")}
              />
              <Field
                icon={<Globe />}
                label="Nationality"
                value={form.nationality}
                onChange={set("nationality")}
              />
              <Field
                icon={<FileText />}
                label="Passport number"
                value={form.passport_no}
                onChange={set("passport_no")}
              />

              <label className="block sm:col-span-2 relative">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                  <Globe className="h-3.5 w-3.5 text-gold/70" /> Language Preference
                </span>
                <div className="relative">
                  <select
                    value={form.language}
                    onChange={set("language")}
                    className="w-full h-12 appearance-none bg-white/[0.02] border border-white/10 px-4 text-sm text-white outline-none focus:border-gold focus:bg-white/[0.04] transition-all cursor-pointer"
                  >
                    <option value="en" className="bg-[#0a0511]">English</option>
                    <option value="fr" className="bg-[#0a0511]">French</option>
                    <option value="ar" className="bg-[#0a0511]">Arabic</option>
                    <option value="pt" className="bg-[#0a0511]">Portuguese</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    ▼
                  </div>
                </div>
              </label>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <SectionTitle>Emergency Contact</SectionTitle>
            <Card className="grid sm:grid-cols-2 gap-5 border-white/10 bg-[#0a0511]/50">
              <Field
                icon={<HeartPulse />}
                label="Contact name"
                value={form.emergency_contact_name}
                onChange={set("emergency_contact_name")}
              />
              <Field
                icon={<Phone />}
                label="Contact phone"
                value={form.emergency_contact_phone}
                onChange={set("emergency_contact_phone")}
              />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <SectionTitle>Travel Preferences</SectionTitle>
            <Card className="grid sm:grid-cols-2 gap-5 border-white/10 bg-[#0a0511]/50">
              <Field
                icon={<Car />}
                label="Preferred vehicle"
                value={form.preferred_vehicle}
                onChange={set("preferred_vehicle")}
                placeholder="e.g. Mercedes S-Class"
              />
              <Field
                icon={<Plane />}
                label="Preferred airport"
                value={form.preferred_airport}
                onChange={set("preferred_airport")}
                placeholder="e.g. Lagos (LOS)"
              />
              <label className="block sm:col-span-2">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-gold/70" />
                  Notes for your chauffeur & concierge
                </span>
                <textarea
                  rows={4}
                  value={form.travel_preferences}
                  onChange={set("travel_preferences")}
                  placeholder="Any dietary requirements, specific routes, or ambient preferences..."
                  className="w-full bg-white/[0.02] border border-white/10 p-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-gold focus:bg-white/[0.04] transition-all resize-y"
                />
              </label>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex justify-end pt-4"
          >
            <button
              disabled={busy}
              type="submit"
              className="h-12 px-8 bg-crimson hover:bg-crimson/90 text-white text-[10px] uppercase tracking-[0.2em] inline-flex items-center gap-3 transition-all disabled:opacity-50 disabled:hover:bg-crimson shadow-[0_0_15px_rgba(220,20,60,0.15)] hover:shadow-[0_0_20px_rgba(220,20,60,0.3)]"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {busy ? "Saving Changes..." : "Save Profile"}
            </button>
          </motion.div>
        </form>
      </div>
    </PortalLayout>
  );
}

// Sub-components

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 text-gold/70">{icon}</span>
        {label}
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-12 bg-white/[0.02] border border-white/10 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-gold focus:bg-white/[0.04] transition-all"
      />
    </label>
  );
}
