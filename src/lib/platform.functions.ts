import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSuperUser } from "@/lib/platform.server";


/** Staff account directory enriched with auth metadata (last sign-in, email). */
export const listStaffAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id,role");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id,full_name,phone,suspended,organization_id");
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]));
    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (users?.users ?? []).map((u) => {
      const p: any = profMap.get(u.id) ?? {};
      return {
        id: u.id,
        email: u.email ?? "—",
        full_name: p.full_name ?? (u.user_metadata as any)?.full_name ?? "Unnamed",
        phone: p.phone ?? null,
        suspended: !!p.suspended,
        organization_id: p.organization_id ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        created_at: u.created_at,
        confirmed: !!u.email_confirmed_at,
        roles: roleMap.get(u.id) ?? [],
      };
    });
  });

export const staffAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    action: z.enum(["suspend", "reinstate", "force_logout", "reset_password"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperUser(context.supabase, context.userId);
    if (data.userId === context.userId && data.action === "suspend") {
      throw new Error("You cannot suspend your own platform owner account");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "suspend" || data.action === "reinstate") {
      const suspended = data.action === "suspend";
      await supabaseAdmin.from("profiles").update({ suspended }).eq("id", data.userId);
      if (suspended) await supabaseAdmin.auth.admin.signOut(data.userId, "global" as never).catch(() => {});
    }
    if (data.action === "force_logout") {
      await supabaseAdmin.auth.admin.signOut(data.userId, "global" as never);
    }
    if (data.action === "reset_password") {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (!u?.user?.email) throw new Error("Account has no email address");
      await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: u.user.email });
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_name: (context.claims as any)?.email ?? "Platform Owner",
      action: data.action,
      entity: "staff_account",
      entity_id: data.userId,
      detail: `Control Plane · ${data.action.replace("_", " ")}`,
    });
    await supabaseAdmin.from("security_events").insert({
      kind: data.action === "reset_password" ? "password_reset" : "permission_change",
      severity: data.action === "suspend" ? "high" : "medium",
      actor_id: context.userId,
      detail: `${data.action.replace("_", " ")} on ${data.userId}`,
    });

    return { ok: true };
  });
