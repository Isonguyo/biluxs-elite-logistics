import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { dt, useNotifications } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/notifications")({
  head: () => ({ meta: [
    { title: "Notifications — BiLUXS Member Portal" },
    { name: "description", content: "Realtime alerts for chauffeur assignment, payments, trips, cargo and concierge updates." },
    { property: "og:title", content: "Notifications — BiLUXS" },
    { property: "og:description", content: "Every BiLUXS update in real time." },
  ] }),
  component: Page,
});

function Page() {
  const { items, unread, markRead, markAll } = useNotifications();
  return (
    <PortalLayout title="Notifications" subtitle="Realtime updates across every BiLUXS service."
      actions={<button onClick={markAll} className="h-10 px-4 border border-border hover:border-gold text-[10px] uppercase tracking-widest">Mark all read ({unread})</button>}>
      {items.length === 0 ? <Empty text="Nothing here yet." /> : (
        <div className="grid gap-2">
          {items.map((n) => (
            <Card key={n.id} className={`flex items-start gap-4 ${n.read ? "opacity-60" : "border-gold/40"}`}>
              <span className={`mt-2 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-white/20" : "bg-crimson"}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm">{n.title}</div>
                {n.body && <div className="text-[12px] text-muted-foreground mt-1">{n.body}</div>}
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">{n.kind} · {dt(n.created_at)}</div>
              </div>
              {!n.read && <button onClick={() => markRead(n.id)} className="text-[10px] uppercase tracking-widest text-gold">Mark read</button>}
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
