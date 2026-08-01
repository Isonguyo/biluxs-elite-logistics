import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/settings")({
  head: () => ({ meta: [
    { title: "Settings — BiLUXS Member Portal" },
    { name: "description", content: "Security, two-factor authentication, appearance and notification preferences." },
    { property: "og:title", content: "Settings — BiLUXS" },
    { property: "og:description", content: "Security, two-factor authentication, appearance and notification preferences." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Settings" subtitle="Security, two-factor authentication, appearance and notification preferences.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Settings request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
