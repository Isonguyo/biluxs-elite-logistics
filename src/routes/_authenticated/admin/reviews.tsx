import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: Page,
});

function Page() {
  const { rows: reviews, reload } = useTable("driver_reviews", { order: "created_at" });
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "flagged">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = reviews.filter((r: Row) => {
    if (filter === "all") return true;
    if (filter === "pending") return !r.moderation_status || r.moderation_status === "pending";
    if (filter === "approved") return r.moderation_status === "approved";
    if (filter === "flagged") return r.moderation_status === "flagged";
    return true;
  });

  const updateStatus = async (reviewId: string, status: "approved" | "flagged", action: string) => {
    setBusyId(reviewId);
    const { error } = await supabase
      .from("driver_reviews")
      .update({ moderation_status: status, reviewed_at: new Date().toISOString() })
      .eq("id", reviewId);
    setBusyId(null);
    if (error) return toast.error(error.message);
    await logAudit("moderate_review", "driver_review", reviewId, action);
    toast.success(action);
    void reload();
  };

  const approve = (r: Row) => updateStatus(r.id, "approved", `Review approved`);
  const flag = (r: Row) => updateStatus(r.id, "flagged", `Review flagged for manual review`);

  const pending = reviews.filter((r: Row) => !r.moderation_status || r.moderation_status === "pending").length;
  const approved = reviews.filter((r: Row) => r.moderation_status === "approved").length;
  const flagged = reviews.filter((r: Row) => r.moderation_status === "flagged").length;

  return (
    <AdminLayout title="Review Moderation" subtitle="Driver ratings and feedback — moderate content, flag concerning reviews, and maintain quality standards.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Reviews" value={reviews.length.toString()} />
        <Stat label="Pending Moderation" value={pending.toString()} accent={pending > 0} />
        <Stat label="Approved" value={approved.toString()} />
        <Stat label="Flagged" value={flagged.toString()} />
      </div>

      <Panel
        title="Review Queue"
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="h-8 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold"
          >
            {["all", "pending", "approved", "flagged"].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        }
      >
        <div className="divide-y divide-border max-h-[680px] overflow-y-auto">
          {filtered.map((r: Row) => {
            const driver = drivers.find((d) => d.id === r.driver_id);
            const rating = Number(r.rating ?? 0);
            return (
              <div key={r.id} className={`p-4 ${!r.moderation_status || r.moderation_status === "pending" ? "bg-gold/5" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-gold text-xs">{"★".repeat(rating)}</div>
                      <Pill tone={!r.moderation_status || r.moderation_status === "pending" ? "warn" : r.moderation_status === "approved" ? "good" : "bad"}>
                        {r.moderation_status || "pending"}
                      </Pill>
                    </div>
                    <div className="text-sm text-white/90">
                      {r.customer_name ? `${r.customer_name} → ${driver?.full_name ?? "Unknown driver"}` : driver?.full_name ?? "Review"}
                    </div>
                    <div className="text-xs text-white/80 mt-2 whitespace-pre-wrap">{r.comment}</div>
                    <div className="text-[10px] text-muted-foreground mt-2">{since(r.created_at)}</div>
                  </div>
                </div>
                {(!r.moderation_status || r.moderation_status === "pending") && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approve(r)}
                      disabled={busyId === r.id}
                      className="h-8 px-3 inline-flex items-center gap-1 border border-emerald-500/40 text-emerald-300 text-[10px] uppercase tracking-widest hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => flag(r)}
                      disabled={busyId === r.id}
                      className="h-8 px-3 inline-flex items-center gap-1 border border-crimson/40 text-crimson text-[10px] uppercase tracking-widest hover:bg-crimson/10 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" /> Flag
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {!filtered.length && <Empty>No reviews in this category.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
