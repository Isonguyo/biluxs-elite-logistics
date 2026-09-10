import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, since, inRange, startOfDay, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/schedule")({
  component: Page,
});

function Page() {
  const { rows: bookings } = useTable("bookings", { realtime: false });
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [q, setQ] = useState("");

  const dateObj = new Date(selectedDate + "T00:00:00");
  const today = startOfDay();

  const filteredBookings = useMemo(() => {
    let list = bookings.filter((b: Row) => b.driver_id && inRange(b.created_at, dateObj));
    if (selectedDriver) list = list.filter((b: Row) => b.driver_id === selectedDriver);
    if (q) {
      const hay = q.toLowerCase();
      list = list.filter((b: Row) =>
        `${b.waybill_code} ${b.pickup_location} ${b.dropoff_location}`.toLowerCase().includes(hay)
      );
    }
    return list.sort((a: Row, b: Row) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [bookings, selectedDriver, selectedDate, q]);

  const driverStats = useMemo(() => {
    return drivers.map((d: Row) => {
      const trips = bookings.filter((b: Row) => b.driver_id === d.id && inRange(b.created_at, dateObj));
      const completed = trips.filter((b: Row) => b.status === "completed").length;
      const inProgress = trips.filter((b: Row) => b.status === "in_progress").length;
      return { driver: d, trips: trips.length, completed, inProgress, status: d.availability ?? d.status ?? "offline" };
    });
  }, [drivers, bookings, dateObj]);

  const todayDate = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === todayDate;

  return (
    <AdminLayout
      title="Driver Schedule"
      subtitle="Timeline view of driver assignments and trip progression. Select a date and driver to inspect their workload."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Assignments" value={filteredBookings.length.toString()} />
        <Stat
          label="Completed"
          value={filteredBookings.filter((b) => b.status === "completed").length.toString()}
        />
        <Stat label="In Progress" value={filteredBookings.filter((b) => b.status === "in_progress").length.toString()} accent />
        <Stat label="Pending" value={filteredBookings.filter((b) => b.status === "pending").length.toString()} />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Schedule Timeline
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 px-2 bg-input border border-border text-xs outline-none focus:border-gold"
              />
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search waybill or route"
                  className="h-8 pl-7 pr-2 bg-input border border-border text-xs outline-none focus:border-gold w-48"
                />
              </div>
            </div>
          }
        >
          <div className="divide-y divide-border max-h-[680px] overflow-y-auto">
            {filteredBookings.map((b: Row) => {
              const driver = drivers.find((d) => d.id === b.driver_id);
              const startTime = new Date(b.created_at);
              const duration = b.updated_at
                ? Math.round((new Date(b.updated_at).getTime() - startTime.getTime()) / 60000)
                : 0;
              return (
                <div key={b.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-display tracking-widest text-sm">{b.waybill_code}</div>
                        <Pill
                          tone={
                            b.status === "completed"
                              ? "good"
                              : b.status === "in_progress"
                                ? "warn"
                                : b.status === "cancelled"
                                  ? "bad"
                                  : "neutral"
                          }
                        >
                          {b.status}
                        </Pill>
                      </div>
                      <div className="text-xs text-white/80 mt-1">
                        <div className="truncate">{driver?.full_name ?? "Unassigned"}</div>
                        <div className="truncate text-muted-foreground">
                          {b.pickup_location} → {b.dropoff_location}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {duration > 0 && ` · ${duration}m elapsed`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!filteredBookings.length && <Empty>No assignments for this date and filter.</Empty>}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Driver Workload">
            <div className="divide-y divide-border max-h-[680px] overflow-y-auto">
              {driverStats.map(({ driver, trips, completed, inProgress, status }) => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(selectedDriver === driver.id ? null : driver.id)}
                  className={`w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors ${
                    selectedDriver === driver.id ? "bg-white/[0.05]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{driver.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{since(driver.last_seen_at)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Trips</div>
                    <div className="font-display text-base">{trips}</div>
                  </div>
                </button>
              ))}
              {!drivers.length && <Empty>No drivers registered.</Empty>}
            </div>
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
}
