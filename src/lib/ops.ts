import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/admin";

/** Buffer applied before and after every journey for transition/travel time. */
const BUFFER_MS = 30 * 60 * 1000;
const MIN_DURATION_MS = 45 * 60 * 1000;
const ACTIVE = ["pending", "confirmed", "in_progress"];

export type Window = { start: number; end: number };

/** Occupied window for a booking: pickup − 30m … pickup + drive time + 30m. */
export function bookingWindow(b: Row): Window {
  const start = new Date(b.pickup_time ?? b.created_at).getTime();
  const drive = Math.max(MIN_DURATION_MS, (Number(b.distance_km ?? 0) / 40) * 3600 * 1000);
  return { start: start - BUFFER_MS, end: start + drive + BUFFER_MS };
}

export const overlaps = (a: Window, b: Window) => a.start < b.end && b.start < a.end;

export const fmtWindow = (w: Window) =>
  `${new Date(w.start).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} – ${new Date(w.end).toLocaleTimeString(undefined, { timeStyle: "short" })}`;

export type AvailState = "available" | "busy" | "unavailable" | "conflict";

export type Availability = { state: AvailState; conflict?: Row; reason?: string };

/** Availability of a chauffeur, optionally judged against a target booking. */
export function driverAvailability(driver: Row, bookings: Row[], target?: Row | null): Availability {
  if (driver.status !== "active" || driver.availability === "unavailable") {
    return { state: "unavailable", reason: driver.status !== "active" ? String(driver.status) : "Marked unavailable" };
  }
  const mine = bookings.filter((b) => b.driver_id === driver.id && ACTIVE.includes(b.status) && b.id !== target?.id);
  if (target) {
    const win = bookingWindow(target);
    const clash = mine.find((b) => overlaps(bookingWindow(b), win));
    if (clash) return { state: "conflict", conflict: clash, reason: "Overlapping assignment" };
  }
  const now = Date.now();
  const onNow = mine.find((b) => {
    const w = bookingWindow(b);
    return now >= w.start && now <= w.end;
  });
  if (onNow) return { state: "busy", conflict: onNow, reason: "On an active assignment" };
  return { state: "available" };
}

export function vehicleAvailability(vehicle: Row, bookings: Row[], target?: Row | null): Availability {
  if (vehicle.status === "maintenance") return { state: "unavailable", reason: "In maintenance" };
  const mine = bookings.filter((b) => b.vehicle_id === vehicle.id && ACTIVE.includes(b.status) && b.id !== target?.id);
  if (target) {
    const win = bookingWindow(target);
    const clash = mine.find((b) => overlaps(bookingWindow(b), win));
    if (clash) return { state: "conflict", conflict: clash, reason: "Already booked for this time" };
  }
  const now = Date.now();
  if (mine.some((b) => { const w = bookingWindow(b); return now >= w.start && now <= w.end; })) {
    return { state: "busy", reason: "Currently engaged" };
  }
  return { state: "available" };
}

export const availTone = (s: AvailState) =>
  s === "available" ? "good" : s === "busy" ? "warn" : s === "conflict" ? "bad" : "neutral";

/** Usage analytics for one vehicle. */
export function vehicleUsage(vehicleId: string, bookings: Row[]) {
  const mine = bookings.filter((b) => b.vehicle_id === vehicleId);
  const now = Date.now();
  const week = now - 7 * 864e5;
  const month = now - 30 * 864e5;
  const at = (b: Row) => new Date(b.pickup_time ?? b.created_at).getTime();
  const completed = mine.filter((b) => b.status === "completed");
  const upcoming = mine
    .filter((b) => ACTIVE.includes(b.status) && at(b) >= now)
    .sort((a, b) => at(a) - at(b))[0] ?? null;
  const recent = mine.filter((b) => at(b) <= now).sort((a, b) => at(b) - at(a))[0] ?? null;
  return {
    total: mine.length,
    completed: completed.length,
    week: mine.filter((b) => at(b) >= week).length,
    month: mine.filter((b) => at(b) >= month).length,
    utilization: Math.min(100, Math.round((mine.filter((b) => at(b) >= week).length / 14) * 100)),
    upcoming,
    recent,
  };
}

export type Trust = {
  driver_id: string;
  full_name: string;
  completed_rides: number;
  cancelled_rides: number;
  verified_rides: number;
  review_count: number;
  avg_rating: number;
  open_incidents: number;
  total_incidents: number;
  trust_score: number;
};

/** Server-calculated, explainable trust score per chauffeur. */
export function useDriverTrust() {
  const [rows, setRows] = useState<Trust[]>([]);
  useEffect(() => {
    void (async () => {
      const { data } = await (supabase as any).from("driver_trust").select("*");
      setRows((data as Trust[]) ?? []);
    })();
  }, []);
  const map: Record<string, Trust> = {};
  rows.forEach((r) => { map[r.driver_id] = r; });
  return { trust: rows, trustOf: (id?: string | null) => (id ? map[id] : undefined) };
}

/** Profiles keyed by id — used to show real customer photos everywhere. */
export function useProfileMap(ids: (string | null | undefined)[]) {
  const key = [...new Set(ids.filter(Boolean) as string[])].sort().join(",");
  const [map, setMap] = useState<Record<string, Row>>({});
  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!list.length) { setMap({}); return; }
    let alive = true;
    void (async () => {
      const { data } = await (supabase as any).from("profiles").select("*").in("id", list);
      if (!alive) return;
      const next: Record<string, Row> = {};
      ((data as Row[]) ?? []).forEach((p) => { next[p.id] = p; });
      setMap(next);
    })();
    return () => { alive = false; };
  }, [key]);
  return map;
}

export const dtShort = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
