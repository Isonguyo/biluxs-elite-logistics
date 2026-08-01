import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/support")({
  head: () => ({ meta: [
    { title: "Support — BiLUXS Member Portal" },
    { name: "description", content: "24/7 BiLUXS assistance, emergency escalation and help topics." },
    { property: "og:title", content: "Support — BiLUXS" },
    { property: "og:description", content: "24/7 BiLUXS assistance, emergency escalation and help topics." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Support" subtitle="24/7 BiLUXS assistance, emergency escalation and help topics.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Support request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
