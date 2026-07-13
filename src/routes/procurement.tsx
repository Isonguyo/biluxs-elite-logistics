import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Globe, ShoppingBag, Image as ImageIcon, Check, ArrowRight, ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { useAuth } from "@/hooks/useAuth";
import heroShopping from "@/assets/hero-shopping.jpg";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Personal Procurement — Luxury Shopping Concierge | BiLUXS Calabar" },
      { name: "description", content: "Order Louis Vuitton, Gucci, Hermès, Zara and more from London, Paris, Dubai and New York. BiLUXS Personal Procurement delivers to Calabar." },
      { property: "og:title", content: "BiLUXS Personal Procurement" },
      { property: "og:description", content: "Global luxury shopping concierge for the discerning Nigerian client." },
      { property: "og:image", content: heroShopping },
    ],
    links: [{ rel: "canonical", href: "/procurement" }],
  }),
  component: Page,
});

const CITIES = ["London", "Paris", "Dubai", "New York", "Milan", "Istanbul"];
const STEPS = ["City", "Item", "Details", "References"];

function Page() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [item, setItem] = useState("");
  const [size, setSize] = useState("");
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [website_verify, setWebsiteVerify] = useState(""); // honeypot
  const lastSubmitRef = useRef<number>(0);
  const submitLockRef = useRef(false);

  const canNext = () => {
    if (step === 0) return !!city;
    if (step === 1) return item.trim().length > 1;
    return true;
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 6);
    setFiles(next);
  };

  const submit = async () => {
    if (website_verify) { console.warn("Bot submission blocked"); return; }
    const now = Date.now();
    if (submitLockRef.current || now - lastSubmitRef.current < 2000) return;
    submitLockRef.current = true;
    lastSubmitRef.current = now;
    if (!user) { toast.error("Sign in to submit a procurement request."); navigate({ to: "/login" }); submitLockRef.current = false; return; }
    setSubmitting(true);
    const urls: string[] = [];
    for (const f of files) {
      const path = `${user.id}/${Date.now()}-${f.name}`;
      const { error: upErr } = await supabase.storage.from("procurement-refs").upload(path, f, { upsert: false });
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); continue; }
      const { data: signed } = await supabase.storage.from("procurement-refs").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signed?.signedUrl) urls.push(signed.signedUrl);
    }
    const { error } = await supabase.from("procurement_requests").insert({
      user_id: user.id, item_description: item, brand: brand || null, source_city: city,
      estimated_value: value, size: size || null, notes: notes || null,
      reference_images: urls,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Procurement request submitted — our concierge will reach out within 12 hours.");
    navigate({ to: "/dashboard" });
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Global Concierge"
        title={<>Personal <span className="gradient-text">Procurement</span></>}
        subtitle="From Bond Street to Dubai Mall — tell us what you want, we hunt it, authenticate it and deliver it to your door in Calabar."
        image={heroShopping}
      />

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="bg-card border border-border p-8">
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`h-9 w-9 grid place-items-center text-xs font-bold border ${
                    i <= step ? "bg-crimson border-crimson text-white" : "border-border text-muted-foreground"
                  }`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
                  <div className="hidden sm:block text-[10px] uppercase tracking-widest text-muted-foreground">{s}</div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-crimson" : "bg-border"}`} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {step === 0 && (
                  <div>
                    <h2 className="font-display text-2xl flex items-center gap-2"><Globe className="h-5 w-5 text-gold" /> Source City</h2>
                    <p className="text-xs text-muted-foreground mt-2">Where would you like us to shop?</p>
                    <div className="mt-6 grid sm:grid-cols-3 gap-3">
                      {CITIES.map((c) => (
                        <button key={c} type="button" onClick={() => setCity(c)}
                          className={`p-5 border text-left transition-colors ${city === c ? "border-gold bg-gold/10" : "border-border hover:border-white/40"}`}>
                          <div className="text-[10px] uppercase tracking-widest text-gold">Flagship</div>
                          <div className="font-display text-2xl tracking-wide mt-1">{c}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div>
                    <h2 className="font-display text-2xl flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-gold" /> What Are We Buying?</h2>
                    <div className="mt-6 grid gap-4">
                      <Field label="Brand"><input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={80}
                        placeholder="e.g. Louis Vuitton, Gucci, Zara" className="input" /></Field>
                      <Field label="Item description *"><textarea value={item} onChange={(e) => setItem(e.target.value)} maxLength={500} rows={4}
                        placeholder="e.g. Neverfull MM tote in damier ebene canvas" className="input min-h-28 py-3" /></Field>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Size / variant"><input value={size} onChange={(e) => setSize(e.target.value)} maxLength={50}
                          placeholder="e.g. EU 42, Medium" className="input" /></Field>
                        <Field label="Estimated value (₦)"><input type="number" min={0} value={value || ""} onChange={(e) => setValue(Number(e.target.value))}
                          placeholder="2500000" className="input" /></Field>
                      </div>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <h2 className="font-display text-2xl">Concierge Notes</h2>
                    <p className="text-xs text-muted-foreground mt-2">Anything else our agents should know — colour preferences, alternates, gift wrap, delivery date.</p>
                    <Field label="Notes" className="mt-6"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} rows={8}
                      placeholder="Preferred colours, deadline, occasion…" className="input min-h-44 py-3" /></Field>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <h2 className="font-display text-2xl flex items-center gap-2"><ImageIcon className="h-5 w-5 text-gold" /> Reference Images</h2>
                    <p className="text-xs text-muted-foreground mt-2">Upload up to 6 images (max 10MB each).</p>
                    <label className="mt-6 block border-2 border-dashed border-border hover:border-gold transition-colors p-10 text-center cursor-pointer">
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => addFiles(e.target.files)} />
                      <Upload className="h-8 w-8 text-gold mx-auto mb-3" />
                      <div className="font-display text-lg">Click to upload</div>
                      <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP</div>
                    </label>
                    {!!files.length && (
                      <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {files.map((f, i) => (
                          <div key={i} className="relative aspect-square border border-border overflow-hidden">
                            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setFiles(files.filter((_, x) => x !== i))}
                              className="absolute top-1 right-1 h-6 w-6 grid place-items-center bg-crimson text-white">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between">
              <button disabled={step === 0} onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-2 px-4 h-11 border border-border text-xs uppercase tracking-widest disabled:opacity-30 hover:border-gold transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button disabled={!canNext()} onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-2 px-6 h-11 bg-crimson text-white text-xs uppercase tracking-widest press-effect disabled:opacity-50">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button disabled={submitting} onClick={submit}
                  className="inline-flex items-center gap-2 px-6 h-11 bg-gold text-[var(--navy-deep)] text-xs uppercase tracking-widest font-semibold press-effect disabled:opacity-50">
                  {submitting ? "Submitting…" : <>Submit Request <Check className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </div>

          <aside className="bg-[var(--navy-deep)] border border-border p-6 h-fit">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold">Your Request</div>
            <div className="mt-4 text-sm space-y-3">
              <Row k="City" v={city || "—"} />
              <Row k="Brand" v={brand || "—"} />
              <Row k="Item" v={item || "—"} />
              <Row k="Size" v={size || "—"} />
              <Row k="Value" v={value ? `₦${value.toLocaleString()}` : "—"} />
              <Row k="References" v={`${files.length} image${files.length === 1 ? "" : "s"}`} />
            </div>
            <div className="mt-6 p-3 bg-card border border-gold/30 text-[10px] uppercase tracking-widest text-gold">
              12% concierge fee applies on confirmation
            </div>
          </aside>
        </div>
      </section>

      <style>{`.input{height:3rem;width:100%;background:var(--input);border:1px solid var(--border);padding:0 1rem;font-size:.875rem;outline:none}.input:focus{border-color:var(--gold)}`}</style>
    </PageShell>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</div>{children}</label>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</span><span className="text-right text-white/90 truncate max-w-[60%]">{v}</span></div>;
}
