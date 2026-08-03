import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", s.session.user.id).in("role", ["admin", "super_user"]);
    if (!data || !data.length) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Operations Command Center — BiLUXS" },
      { name: "description", content: "Realtime dispatch, fleet, customer and revenue operations for BiLUXS Elite Logistics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
