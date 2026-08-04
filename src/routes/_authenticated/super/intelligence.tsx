import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { SuperLayout, CPanel, CStat } from "@/components/super/SuperLayout";
import { useTable, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/intelligence")({ component: Page });

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysAgo = (n: number) => { const x = startOfDay(new Date()); x.setDate(x.getDate() - n); return x; };

function Page() {
  const [range, setRange] = useState(30);
  const { rows: bookings } = useTable("bookings", { limit: 2000 });
  const { rows: profiles } = useTable("profiles", { limit: 2000 });
  const { rows: reviews } = useTable("driver_reviews", { limit: 1000 });

  const paid = useMemo(() => bookings.filter((b: Row) => b.payment_status === "paid"), [bookings]);
  const from = daysAgo(range).getTime();
  const inRange = paid.filter((b: Row) => new Date(b.paid_at || b.created_at).getTime() >= from);
  const revenue = inRange.reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0);
  const prev = paid.filter((b: Row) => {
    const t = new Date(b.paid_at || b.created_at).getTime();
    return t >= daysAgo(range * 2).getTime() && t < from;
  }).reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0);
  const growth = prev ? ((revenue - prev) / prev) * 100 : 0;
  const avgValue = inRange.length ? revenue / inRange.length : 0;
  const cancelled = bookings.filter((b: Row) => b.status === "cancelled").length;
  const cancelRate = bookings.length ? (cancelled / bookings.length) * 100 : 0;
  const luxAdoption = paid.length ? (paid.filter((b: Row) => b.luxury_protocol).length / paid.length) * 100 : 0;
  const repeat = (() => {
    const m = new Map<string, number>();
    bookings.forEach((b: Row) => m.set(b.user_id, (m.get(b.user_id) ?? 0) + 1));
    const many = Array.from(m.values()).filter((n) => n > 1).length;
    return m.size ? (many / m.size) * 100 : 0;
  })();
  const csat = reviews.length ? reviews.reduce((a: number, r: Row) => a + Number(r.rating || 0), 0) / reviews.length : 0;
  const ltv = profiles.length ? paid.reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0) / profiles.length : 0;

  const series = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = range - 1; i >= 0; i--) buckets.set(daysAgo(i).toISOString().slice(0, 10), 0);
    paid.forEach((b: Row) => {
      const key = startOfDay(new Date(b.paid_at || b.created_at)).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(b.total_price || 0));
    });
    return Array.from(buckets, ([date, revenue]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }), revenue,
    }));
  }, [paid, range]);

  const routes = useMemo(() => {
    const m = new Map<string, number>();
    bookings.forEach((b: Row) => {
      const k = `${b.pickup_location} → ${b.dropoff_location}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m, ([route, trips]) => ({ route, trips })).sort((a, b) => b.trips - a.trips).slice(0, 8);
  }, [bookings]);

  const hours = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, trips: 0 }));
    bookings.forEach((b: Row) => { arr[new Date(b.pickup_time).getHours()].trips += 1; });
    return arr;
  }, [bookings]);

  const mix = [
    { name: "Luxury Protocol", value: paid.filter((b: Row) => b.luxury_protocol).reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0) },
    { name: "Standard", value: paid.filter((b: Row) => !b.luxury_protocol).reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0) },
  ];

  return (
    <SuperLayout title="Business Intelligence" subtitle="Executive analytics across revenue, growth, retention, adoption and satisfaction."
      actions={
        <select value={range} onChange={(e) => setRange(Number(e.target.value))}
          className="h-9 px-2 bg-input border border-border text-[11px] uppercase tracking-widest outline-none focus:border-crimson">
          {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      }>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <CStat label="Revenue" value={naira(revenue)} tone="good" />
        <CStat label="Growth" value={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`} tone={growth >= 0 ? "good" : "bad"} hint="vs prior period" />
        <CStat label="Avg booking" value={naira(avgValue)} />
        <CStat label="Lifetime value" value={naira(ltv)} />
        <CStat label="Retention" value={`${repeat.toFixed(1)}%`} hint="Repeat travellers" />
        <CStat label="Satisfaction" value={csat ? `${csat.toFixed(1)}★` : "—"} />
        <CStat label="Luxury adoption" value={`${luxAdoption.toFixed(1)}%`} />
        <CStat label="Cancellation rate" value={`${cancelRate.toFixed(1)}%`} tone={cancelRate > 15 ? "bad" : "neutral"} />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4 mb-4">
        <CPanel title={`Revenue · Last ${range} Days`}>
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="cpRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC143C" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#DC143C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1a2036" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0b0d17", border: "1px solid #DC143C", fontSize: 12 }} formatter={(v: any) => naira(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#DC143C" strokeWidth={2} fill="url(#cpRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CPanel>
        <CPanel title="Revenue Mix">
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mix} innerRadius={55} outerRadius={90} dataKey="value" stroke="none">
                  <Cell fill="#DC143C" /><Cell fill="#0b0d17" stroke="#D4AF37" />
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0b0d17", border: "1px solid #D4AF37", fontSize: 12 }} formatter={(v: any) => naira(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CPanel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Peak Hours">
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours}>
                <CartesianGrid stroke="#1a2036" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#5a6478" fontSize={9} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0b0d17", border: "1px solid #DC143C", fontSize: 12 }} />
                <Bar dataKey="trips" fill="#DC143C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CPanel>
        <CPanel title="Top Routes">
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {routes.map((r) => (
              <div key={r.route} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{r.route}</span>
                <span className="font-display">{r.trips}</span>
              </div>
            ))}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
