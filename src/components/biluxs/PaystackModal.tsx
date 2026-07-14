import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShieldCheck, Loader2, Check, X, Lock } from "lucide-react";

export type PaymentResult = { ref: string; amount: number };

export function PaystackModal({
  open, amount, email, onClose, onSuccess,
}: {
  open: boolean; amount: number; email: string;
  onClose: () => void; onSuccess: (r: PaymentResult) => void;
}) {
  const [card, setCard] = useState("4084 0840 8408 4081");
  const [expiry, setExpiry] = useState("12/29");
  const [cvv, setCvv] = useState("123");
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");

  useEffect(() => { if (open) setPhase("form"); }, [open]);

  const pay = async () => {
    setPhase("processing");
    // Simulated Paystack processing
    await new Promise((r) => setTimeout(r, 1600));
    setPhase("success");
    await new Promise((r) => setTimeout(r, 900));
    const ref = `PSK_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    onSuccess({ ref, amount });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm grid place-items-center p-4">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 22 }}
            className="w-full max-w-md bg-[var(--navy-deep)] border border-gold/30 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-emerald-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 grid place-items-center bg-emerald-500 rounded">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Paystack</div>
                  <div className="text-[10px] text-muted-foreground">Secure Checkout · Test Mode</div>
                </div>
              </div>
              {phase === "form" && (
                <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
              )}
            </div>

            <div className="p-6">
              {phase === "form" && (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pay to BiLUXS</div>
                  <div className="font-display text-3xl mt-1">₦{Math.round(amount).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">{email}</div>

                  <div className="mt-6 space-y-3">
                    <Field icon={<CreditCard className="h-4 w-4" />} label="Card number"
                      value={card} onChange={setCard} placeholder="0000 0000 0000 0000" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Expiry" value={expiry} onChange={setExpiry} placeholder="MM/YY" />
                      <Field label="CVV" value={cvv} onChange={setCvv} placeholder="123" />
                    </div>
                  </div>

                  <button onClick={pay}
                    className="mt-6 w-full h-12 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-semibold inline-flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" /> Pay ₦{Math.round(amount).toLocaleString()}
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> PCI-DSS · 3D Secure · Test environment
                  </div>
                </>
              )}
              {phase === "processing" && (
                <div className="py-12 grid place-items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                  <div className="text-sm text-muted-foreground">Verifying with your bank…</div>
                </div>
              )}
              {phase === "success" && (
                <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="py-12 grid place-items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 grid place-items-center">
                    <Check className="h-8 w-8 text-white" strokeWidth={3} />
                  </div>
                  <div className="font-display text-xl">Payment Successful</div>
                  <div className="text-xs text-muted-foreground">Generating secure boarding QR…</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ icon, label, value, onChange, placeholder }: {
  icon?: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2 border border-border bg-input px-3 h-11 focus-within:border-emerald-400">
        {icon}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="bg-transparent outline-none text-sm flex-1" />
      </div>
    </label>
  );
}
