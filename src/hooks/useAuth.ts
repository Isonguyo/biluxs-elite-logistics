import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_user" | "admin" | "driver" | "customer" | "corporate_admin" | "user";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    const loadRoles = async (uid: string) => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) {
        setRoles([]);
        return;
      }
      setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadRoles(s.user.id), 0);
      else setRoles([]);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await loadRoles(s.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const has = (r: AppRole) => roles.includes(r);
  return {
    session, user, loading, roles,
    isSuperUser: has("super_user"),
    isAdmin: has("admin") || has("super_user"),
    isDriver: has("driver") || has("admin") || has("super_user"),
    signOut: () => supabase.auth.signOut(),
  };
}
