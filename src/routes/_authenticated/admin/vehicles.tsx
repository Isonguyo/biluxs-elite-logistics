import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminVehicles } from "@/routes/_authenticated/admin/vehicle";

export const Route = createFileRoute("/_authenticated/admin/vehicles")({
  component: Page,
});

function Page() {
  return (
    <AdminLayout title="Fleet Management" subtitle="Monitor vehicle status, maintenance schedules, and assignments.">
      <AdminVehicles />
    </AdminLayout>
  );
}
