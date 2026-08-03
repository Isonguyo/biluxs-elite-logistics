import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout, Panel, Pill } from "@/components/admin/AdminLayout";
import { useTable } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Page });

const ROLES = [
  ["Dispatcher", "Assign chauffeurs, manage the queue"],
  ["Operations Manager", "Full operations, fleet and drivers"],
  ["Finance", "Payments, refunds, reports"],
  ["Support", "Tickets, concierge, customer care"],
  ["Fleet Manager", "Vehicles, inspections, maintenance"],
  ["Admin", "Runs the business day to day"],
  ["Super Admin", "Runs the platform"],
] as const;

function Page() {
  const { rows: roles } = useTable("user_roles", { order: "user_id", ascending: true, realtime: false });
  return (
    <AdminLayout title="System Settings" subtitle="Operating posture of the command center. Role grants, pricing and integrations are governed by the Control Plane.">
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Role Model">
          <div className="divide-y divide-border">
            {ROLES.map(([name, desc]) => (
              <div key={name} className="p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{name}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                </div>
                <Pill tone={["Admin", "Super Admin"].includes(name) ? "good" : "neutral"}>
                  {["Admin", "Super Admin"].includes(name) ? "live" : "planned"}
                </Pill>
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Grants In Effect">
            <div className="p-4 text-sm space-y-2">
              <div>Assigned role records: <span className="font-display text-gold">{roles.length}</span></div>
              <p className="text-xs text-muted-foreground">
                Admins have read and operate rights. Granting or revoking a role is reserved for the Super User Control Plane.
              </p>
              <Link to="/super" className="h-9 px-3 inline-flex items-center border border-crimson text-crimson text-[10px] uppercase tracking-widest">Open Control Plane</Link>
            </div>
          </Panel>
          <Panel title="Platform Health">
            <div className="p-4 text-xs space-y-2 text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Realtime channel connected</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Database policies enforced (RLS)</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Audit trail recording</div>
            </div>
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
}
