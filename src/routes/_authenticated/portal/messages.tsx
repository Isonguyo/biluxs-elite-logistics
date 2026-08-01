import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/messages")({
  head: () => ({ meta: [
    { title: "Messages — BiLUXS Member Portal" },
    { name: "description", content: "Chat with your chauffeur, concierge, consultant and BiLUXS support." },
    { property: "og:title", content: "Messages — BiLUXS" },
    { property: "og:description", content: "Chat with your chauffeur, concierge, consultant and BiLUXS support." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Messages" subtitle="Chat with your chauffeur, concierge, consultant and BiLUXS support.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Messages request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
