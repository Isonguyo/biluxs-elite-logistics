import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { dt, useNotifications } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — BiLUXS Member Portal" },
      {
        name: "description",
        content:
          "Realtime alerts for chauffeur assignment, payments, trips, cargo and concierge updates.",
      },
      { property: "og:title", content: "Notifications — BiLUXS" },
      { property: "og:description", content: "Every BiLUXS update in real time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { items, unread, markRead, markAll } = useNotifications();

  return (
    <PortalLayout
      title="Notifications"
      subtitle="Real-time updates across every BiLUXS service."
      actions={
        unread > 0 ? (
          <button
            onClick={markAll}
            className="h-10 px-4 border border-gold/30 bg-white/[0.02] text-gold text-[10px] uppercase tracking-[0.22em] inline-flex items-center gap-2 hover:bg-gold/10 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mark all read ({unread})</span>
          </button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <Empty text="You're all caught up. No new notifications." />
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card
                  className={`flex items-start gap-4 transition-all duration-500 ${
                    n.read
                      ? "opacity-60 border-white/5 bg-white/[0.01]"
                      : "border-gold/40 bg-gradient-to-br from-[#0a0511] to-gold/5 shadow-[0_4px_20px_rgba(212,175,55,0.05)]"
                  }`}
                >
                  <div className="shrink-0 mt-1.5">
                    {n.read ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    ) : (
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-crimson animate-ping opacity-75" />
                        <span className="relative block h-1.5 w-1.5 rounded-full bg-crimson shadow-[0_0_8px_rgba(220,20,60,0.8)]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm md:text-base transition-colors ${
                        n.read ? "text-white/70" : "text-white"
                      }`}
                    >
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="text-[13px] text-white/50 mt-1 leading-relaxed">
                        {n.body}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 mt-3">
                      <span className="text-gold/70">
                        {n.kind.replace(/_/g, " ")}
                      </span>
                      <span>&middot;</span>
                      <span>{dt(n.created_at)}</span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      aria-label="Mark as read"
                      className="shrink-0 p-2 text-white/30 hover:text-gold hover:bg-gold/10 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PortalLayout>
  );
}
