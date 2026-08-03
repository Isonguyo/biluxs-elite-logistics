import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AdminLayout, Panel, Stat } from "@/components/admin/AdminLayout";
import { useTable, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: Page });

function Page() {
  const { rows: bookings } = useTable("bookings", { realtime: false });
  const { rows: profiles } = useTable("profiles", { order: "created_at", realtime: false });

  const daily = useMemo(() => {
    const map = new Map<string, { day: string; revenue: number; trips: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { day: key.slice(5), revenue: 0, trips: 0 });
    }
    bookings.forEach((b: Row) => {
      const key = String(b.created_at).slice(0, 10);
      const e = map.get(key); if (!e) return;
      e.trips += 1;
      if (b.payment_status === "paid") e.revenue += Number(b.total_price ?? 0);
    });
    return [...map.values()];
  }, [bookings]);

  const hours = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}`, trips: 0 }));
    bookings.forEach((b: Row) => { arr[new Date(b.created_at).getHours()]!.trips += 1; });
    return arr;
  }, [bookings]);

  const routes = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b: Row) => map.set(b.dropoff_location ?? "—", (map.get(b.dropoff_location ?? "—") ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([route, trips]) => ({ route, trips }));
  }, [bookings]);

  const repeat = new Set(bookings.filter((b, _, arr) => arr.filter((x) => x.user_id === b.user_id).length > 1).map((b) => b.user_id)).size;

  return (
    <AdminLayout title="Analytics" subtitle="Revenue, demand, popular routes and customer behaviour across the network.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="14-Day Revenue" value={naira(daily.reduce((a, d) => a + d.revenue, 0))} accent />
        <Stat label="14-Day Trips" value={daily.reduce((a, d) => a + d.trips, 0).toString()} />
        <Stat label="Repeat Customers" value={repeat.toString()} />
        <Stat label="Customer Base" value={profiles.length.toString()} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Revenue Trend"><div className="h-[280px] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid stroke="#ffffff10" /><XAxis dataKey="day" stroke="#888" fontSize={10} /><YAxis stroke="#888" fontSize={10} />
              <Tooltip contentStyle={{ background: "#05070f", border: "1px solid #d4af3733" }} />
              <Line type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div></Panel>
        <Panel title="Trips Per Day"><div className="h-[280px] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid stroke="#ffffff10" /><XAxis dataKey="day" stroke="#888" fontSize={10} /><YAxis stroke="#888" fontSize={10} />
              <Tooltip contentStyle={{ background: "#05070f", border: "1px solid #d4af3733" }} />
              <Bar dataKey="trips" fill="#d4af37" />
            </BarChart>
          </ResponsiveContainer>
        </div></Panel>
        <Panel title="Peak Hours"><div className="h-[260px] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours}>
              <CartesianGrid stroke="#ffffff10" /><XAxis dataKey="hour" stroke="#888" fontSize={10} /><YAxis stroke="#888" fontSize={10} />
              <Tooltip contentStyle={{ background: "#05070f", border: "1px solid #d4af3733" }} />
              <Bar dataKey="trips" fill="#8b1e2d" />
            </BarChart>
          </ResponsiveContainer>
        </div></Panel>
        <Panel title="Popular Destinations">
          <div className="divide-y divide-border max-h-[260px] overflow-y-auto">
            {routes.map((r) => (
              <div key={r.route} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{r.route}</span><span className="font-display">{r.trips}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
