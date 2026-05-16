import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import herocontactImg from "@/assets/hero-contact.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact BiLUXS — Calabar HQ, Harbour Road" },
      { name: "description", content: "Visit BiLUXS at Cooperative House, Harbour Road, Calabar. Concierge, partnership and corporate inquiries welcome." },
      { property: "og:title", content: "Contact BiLUXS" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Page,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(150).optional(),
  message: z.string().trim().min(1).max(1000),
});

function Page() {
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    if (form.company.trim()) {
      const { error } = await supabase.from("corporate_accounts").insert({
        company_name: form.company, contact_email: form.email, address: form.message,
      });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      toast.success("Partnership request received. Our corporate desk will reach out.");
    } else {
      toast.success("Message received. Our concierge will respond shortly.");
    }
    setForm({ name: "", email: "", message: "", company: "" });
    setSubmitting(false);
  };

  return (
    <PageShell>
      <PageHero image={herocontactImg}
        eyebrow="Contact & Location"
        title={<>Visit our <span className="gradient-text">Calabar HQ</span></>}
        subtitle="Cooperative House, Harbour Road, Calabar, Cross River State — Nigeria."
      />
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gold" /> +234 800 BiLUXS</div>
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gold" /> concierge@biluxs.com</div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-gold" /> Cooperative House, Harbour Road, Calabar</div>
            </div>
            <div className="mt-6 aspect-video border border-border overflow-hidden">
              <iframe
                title="BiLUXS Calabar HQ"
                src="https://www.google.com/maps?q=Harbour%20Road%2C%20Calabar%2C%20Cross%20River&output=embed"
                className="h-full w-full grayscale contrast-125" loading="lazy" />
            </div>
          </div>

          <form onSubmit={submit} className="bg-card border border-border p-8">
            <h2 className="font-display text-2xl tracking-widest mb-6">Inquiry / Partnership</h2>
            <div className="grid gap-4">
              <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="h-12 px-4 bg-input border border-border focus:outline-none focus:border-gold text-sm" />
              <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="h-12 px-4 bg-input border border-border focus:outline-none focus:border-gold text-sm" />
              <input maxLength={150} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company (for partnership requests)" className="h-12 px-4 bg-input border border-border focus:outline-none focus:border-gold text-sm" />
              <textarea required maxLength={1000} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we serve you?" className="px-4 py-3 bg-input border border-border focus:outline-none focus:border-gold text-sm resize-none" />
              <button disabled={submitting} className="h-12 bg-crimson text-white text-xs uppercase tracking-widest press-effect inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? "Sending…" : <>Send Message <Send className="h-4 w-4" /></>}
              </button>
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
