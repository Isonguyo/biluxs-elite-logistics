import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/biluxs/PageShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — BiLUXS Member Portal" },
      { name: "description", content: "Sign in or register for your BiLUXS individual or corporate account." },
    ],
  }),
  component: Page,
});

const credSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  fullName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(150).optional(),
});

function Page() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [account, setAccount] = useState<"individual" | "corporate">("individual");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", company: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: form.fullName, phone: form.phone },
          },
        });
        if (error) throw error;
        if (account === "corporate" && form.company.trim()) {
          await supabase.from("corporate_accounts").insert({
            company_name: form.company, contact_email: form.email, contact_phone: form.phone || null,
          });
        }
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <section className="min-h-[calc(100vh-180px)] grid place-items-center py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-6 bg-card border border-border p-8">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Member Portal</div>
          <h1 className="font-display text-3xl tracking-widest">{mode === "signin" ? "Sign In" : "Create Account"}</h1>

          <div className="mt-6 grid grid-cols-2 border border-border">
            <button onClick={() => setAccount("individual")} type="button"
              className={`h-11 text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2 ${
                account === "individual" ? "bg-crimson text-white" : "hover:bg-white/5"}`}>
              <User className="h-3 w-3" /> Individual
            </button>
            <button onClick={() => setAccount("corporate")} type="button"
              className={`h-11 text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2 ${
                account === "corporate" ? "bg-crimson text-white" : "hover:bg-white/5"}`}>
              <Building2 className="h-3 w-3" /> Corporate
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={<User className="h-4 w-4" />} placeholder="Full name" value={form.fullName}
                  onChange={(v) => setForm({ ...form, fullName: v })} />
                {account === "corporate" && (
                  <Field icon={<Building2 className="h-4 w-4" />} placeholder="Company name" value={form.company}
                    onChange={(v) => setForm({ ...form, company: v })} />
                )}
                <Field placeholder="Phone (optional)" value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })} />
              </>
            )}
            <Field icon={<Mail className="h-4 w-4" />} placeholder="Email address" type="email"
              value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field icon={<Lock className="h-4 w-4" />} placeholder="Password" type="password"
              value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

            <button disabled={submitting}
              className="w-full h-12 bg-crimson text-white text-xs uppercase tracking-widest press-effect inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? "…" : <>{mode === "signin" ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>New here? <button onClick={() => setMode("signup")} className="text-gold hover:underline">Create an account</button></>
            ) : (
              <>Already a member? <button onClick={() => setMode("signin")} className="text-gold hover:underline">Sign in</button></>
            )}
          </div>
          <div className="mt-3 text-center"><Link to="/" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">← Back to home</Link></div>
        </motion.div>
      </section>
    </PageShell>
  );
}

function Field({ icon, ...props }: { icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement> & { onChange: (v: string) => void; value: string }) {
  const { onChange, value, ...rest } = props;
  return (
    <div className="flex items-center bg-input border border-border focus-within:border-gold transition-colors">
      {icon && <div className="pl-3 text-gold">{icon}</div>}
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent h-12 px-3 text-sm focus:outline-none placeholder:text-muted-foreground" />
    </div>
  );
}
