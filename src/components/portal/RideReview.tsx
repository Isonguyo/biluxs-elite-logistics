import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Rate the chauffeur once a ride is complete. Goes to the BiLUXS team for review. */
export function RideReview({ bookingId, driverId, driverName }: {
  bookingId: string; driverId: string; driverName?: string | null;
}) {
  const { user } = useAuth();
  const [existing, setExisting] = useState<{ rating: number; comment: string | null } | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase.from("driver_reviews").select("rating, comment")
      .eq("booking_id", bookingId).eq("reviewer_id", user.id).maybeSingle()
      .then(({ data }) => setExisting(data ?? null));
  }, [bookingId, user]);

  const submit = async () => {
    if (!user || !rating) return;
    setBusy(true);
    const { error } = await supabase.from("driver_reviews").insert({
      booking_id: bookingId, driver_id: driverId, reviewer_id: user.id, rating, comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error("We couldn't save your rating. Please try again."); return; }
    setExisting({ rating, comment: comment.trim() || null });
    toast.success("Thank you — your rating has been sent to the BiLUXS team.");
  };

  if (existing) {
    return (
      <div>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Your rating</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`h-5 w-5 ${n <= existing.rating ? "fill-gold text-gold" : "text-white/25"}`} />
          ))}
        </div>
        {existing.comment && <p className="text-[12px] text-muted-foreground mt-2">“{existing.comment}”</p>}
        <p className="text-[11px] text-muted-foreground mt-2">Thanks for the feedback.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-1">Rate your chauffeur</div>
      <p className="text-[12px] text-muted-foreground mb-3">How was your ride with {driverName?.split(" ")[0] ?? "your chauffeur"}?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
            <Star className={`h-7 w-7 transition-colors ${n <= (hover || rating) ? "fill-gold text-gold" : "text-white/25"}`} />
          </button>
        ))}
      </div>
      <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Anything you'd like us to know? (optional)"
        className="mt-3 w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-gold" />
      <button disabled={!rating || busy} onClick={submit}
        className="mt-2 h-11 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-40">
        {busy ? "Sending…" : "Send rating"}
      </button>
    </div>
  );
}
