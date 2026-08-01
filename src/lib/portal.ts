import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const ngn = (n: number | null | undefined) =>
  "₦" + Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export const dt = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export const dOnly = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export type Tier = { key: string; label: string; min: number; perks: string[] };

export const TIERS: Tier[] = [
  { key: "silver", label: "Silver", min: 0, perks: ["Priority booking", "Standard support"] },
  { key: "gold", label: "Gold", min: 500, perks: ["Free airport meet & greet", "5% wallet bonus", "Priority dispatch"] },
  { key: "diamond", label: "Diamond", min: 2000, perks: ["Complimentary upgrades", "10% wallet bonus", "Dedicated concierge"] },
  { key: "elite", label: "Elite", min: 5000, perks: ["Private security escort", "15% wallet bonus", "24/7 personal assistant", "VIP lounge access"] },
];

export function tierOf(points: number) {
  let current: Tier = TIERS[0]!;
  for (const t of TIERS) if (points >= t.min) current = t;
  const next = TIERS.find((t) => t.min > points) ?? null;
  return { current, next, toNext: next ? next.min - points : 0 };
}

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  passport_no: string | null;
  nationality: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  preferred_vehicle: string | null;
  preferred_airport: string | null;
  language: string;
  travel_preferences: string | null;
  notification_prefs: Record<string, boolean>;
  loyalty_points: number;
  loyalty_tier: string;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile((data as unknown as Profile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  return { profile, loading, reload: load };
}

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const [w, t] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    ]);
    setBalance(Number(w.data?.balance ?? 0));
    setTx(t.data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const ch = supabase
      .channel("wallet-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, load]);

  return { balance, tx, reload: load };
}

export type Notification = {
  id: string; title: string; body: string | null; kind: string;
  link: string | null; read: boolean; created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setItems((data as Notification[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const ch = supabase
      .channel("notif-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, load]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    void load();
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    void load();
  };

  return { items, unread: items.filter((i) => !i.read).length, markRead, markAll, reload: load };
}

export const STATUS_STEPS = ["assigned", "accepted", "en_route", "arrived", "onboard", "started", "completed"] as const;

export const EVENT_LABEL: Record<string, string> = {
  assigned: "Chauffeur assigned",
  accepted: "Chauffeur accepted",
  en_route: "Chauffeur en route",
  arrived: "Chauffeur arrived",
  onboard: "Passenger onboard",
  started: "Trip started",
  completed: "Trip completed",
  cancelled: "Trip cancelled",
  qr_scanned: "Identity verified",
  paid: "Payment confirmed",
};

export function progressFor(events: { event: string }[], status: string) {
  const seen = new Set(events.map((e) => e.event));
  if (status === "completed" || seen.has("completed")) return 100;
  if (seen.has("started") || seen.has("onboard")) return 75;
  if (seen.has("arrived")) return 50;
  if (seen.has("en_route") || seen.has("accepted") || seen.has("assigned")) return 25;
  return 5;
}
