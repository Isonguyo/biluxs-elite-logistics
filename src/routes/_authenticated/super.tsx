import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/super")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", s.session.user.id).eq("role", "super_user").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Control Plane — BiLUXS Platform Governance" },
      { name: "description", content: "Platform governance for BiLUXS: security, roles, pricing, feature flags, integrations, audit and business intelligence." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
