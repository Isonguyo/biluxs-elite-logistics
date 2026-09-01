/** Customer-facing ride language + simple ride-count membership tiers. */

export type StageKey =
  | "received" | "confirmed" | "assigned" | "approaching"
  | "arrived" | "verified" | "in_progress" | "completed" | "cancelled";

export const STAGES: { key: StageKey; label: string }[] = [
  { key: "received", label: "Booking received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "assigned", label: "Chauffeur assigned" },
  { key: "approaching", label: "Driver approaching" },
  { key: "arrived", label: "Driver arrived" },
  { key: "verified", label: "Passenger verified" },
  { key: "in_progress", label: "Ride in progress" },
  { key: "completed", label: "Completed" },
];

export function stageOf(
  booking: { status?: string | null; driver_id?: string | null; qr_status?: string | null } | null | undefined,
  events: { event: string }[] = [],
): StageKey {
  if (!booking) return "received";
  const seen = new Set(events.map((e) => e.event));
  if (booking.status === "cancelled") return "cancelled";
  if (booking.status === "completed" || seen.has("completed")) return "completed";
  if (booking.status === "in_progress" || seen.has("started")) return "in_progress";
  if (booking.qr_status === "used" || seen.has("qr_scanned") || seen.has("onboard")) return "verified";
  if (seen.has("arrived")) return "arrived";
  if (seen.has("en_route") || seen.has("accepted")) return "approaching";
  if (booking.driver_id) return "assigned";
  if (booking.status === "confirmed") return "confirmed";
  return "received";
}

export const stageLabel = (k: StageKey) =>
  k === "cancelled" ? "Cancelled" : (STAGES.find((s) => s.key === k)?.label ?? "Booking received");

export function stageIndex(k: StageKey) {
  const i = STAGES.findIndex((s) => s.key === k);
  return i < 0 ? 0 : i;
}

export function stageProgress(k: StageKey) {
  if (k === "cancelled") return 0;
  return Math.round((stageIndex(k) / (STAGES.length - 1)) * 100);
}

/** Short human sentence describing what's happening / what to do. */
export function stageHint(k: StageKey): string {
  switch (k) {
    case "received": return "We've received your booking and are confirming the details.";
    case "confirmed": return "Your ride is confirmed. A chauffeur will be assigned before pickup.";
    case "assigned": return "Your chauffeur is confirmed. You'll see them move once they set off.";
    case "approaching": return "Your chauffeur is on the way to your pickup point.";
    case "arrived": return "Your chauffeur has arrived. Show your boarding pass to board.";
    case "verified": return "You're verified. Enjoy the journey.";
    case "in_progress": return "You're on your way to your destination.";
    case "completed": return "Ride complete. Tell us how your chauffeur did.";
    case "cancelled": return "This ride was cancelled.";
  }
}

/* ---------- Membership tiers by completed rides ---------- */

export type RideTier = { key: string; label: string; rides: number; benefits: string[] };

export const RIDE_TIERS: RideTier[] = [
  { key: "silver", label: "Silver", rides: 0, benefits: ["Priority booking", "24/7 support"] },
  { key: "gold", label: "Gold", rides: 5, benefits: ["Airport meet & greet", "Priority dispatch"] },
  { key: "platinum", label: "Platinum", rides: 15, benefits: ["Complimentary upgrades", "Dedicated concierge"] },
  { key: "elite", label: "Elite", rides: 30, benefits: ["Security escort", "24/7 personal assistant", "VIP lounge access"] },
];

export function rideTier(completed: number) {
  let current = RIDE_TIERS[0]!;
  for (const t of RIDE_TIERS) if (completed >= t.rides) current = t;
  const next = RIDE_TIERS.find((t) => t.rides > completed) ?? null;
  const floor = current.rides;
  const ceiling = next?.rides ?? Math.max(completed, 1);
  const pct = next ? Math.min(100, Math.round(((completed - floor) / (ceiling - floor)) * 100)) : 100;
  return { current, next, remaining: next ? next.rides - completed : 0, pct, ceiling };
}
