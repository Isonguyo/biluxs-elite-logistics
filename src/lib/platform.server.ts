/** Server-only guards for the Control Plane. */
export async function assertSuperUser(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "super_user").maybeSingle();
  if (!data) throw new Error("Forbidden: platform owner access required");
}
