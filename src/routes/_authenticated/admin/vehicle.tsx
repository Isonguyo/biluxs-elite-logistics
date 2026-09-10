import { useState, useEffect } from "react";
import { Car, ShieldCheck, Wrench, Users, Calendar, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AdminVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFleet() {
      const [vehiclesRes, bookingsRes, driversRes] = await Promise.all([
        supabase.from("vehicles").select("*").order("base_rate"),
        supabase.from("bookings").select("*"),
        supabase.from("drivers").select("*")
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
      setLoading(false);
    }
    loadFleet();

    // Set up realtime subscription for vehicles
    const subscription = supabase
      .channel("vehicles-admin-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        loadFleet(); // Reload on any changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === "all" || v.status === filter;
    const matchesSearch = 
      (v.name || "").toLowerCase().includes(search.toLowerCase()) || 
      (v.category || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Available</span>;
      case "in_use":
      case "in_progress":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-gold/10 text-gold border border-gold/20"><Car className="w-3 h-3" /> Active Trip</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-crimson/10 text-crimson border border-crimson/20"><Wrench className="w-3 h-3" /> Maintenance</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20"><Calendar className="w-3 h-3" /> {status}</span>;
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center border border-border bg-card">
        <div className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">Loading Fleet Database...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="h-9 pl-9 pr-4 bg-white/[0.03] border border-border text-xs focus:border-gold outline-none w-60"
            />
          </div>
          <div className="flex border border-border bg-white/[0.02] p-0.5 text-xs">
            {["all", "available", "in_use", "maintenance"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 capitalize transition-colors ${filter === st ? "bg-gold/20 text-gold" : "text-muted-foreground hover:text-white"}`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <button className="h-9 px-4 bg-gold text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-2 hover:bg-gold/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => {
          // Calculate real usage data based on bookings table
          const activeBooking = bookings.find((b) => b.vehicle_id === vehicle.id && ["in_progress", "confirmed"].includes(b.status));
          const assignedDriver = activeBooking?.driver_id ? drivers.find((d) => d.id === activeBooking.driver_id) : null;
          const tripsCompleted = bookings.filter((b) => b.vehicle_id === vehicle.id && b.status === "completed").length;

          return (
            <div key={vehicle.id} className="border border-border bg-card p-4 flex flex-col sm:flex-row gap-4 hover:border-gold/50 transition-colors">
              <div className="w-full sm:w-48 h-32 relative shrink-0 bg-black/40 border border-border/50 overflow-hidden">
                <img src={vehicle.image_url} alt={vehicle.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-gold border border-gold/30">
                  UNIT-{vehicle.id.slice(0, 4).toUpperCase()}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base text-white">{vehicle.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{vehicle.category}</p>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Assigned Driver</span>
                    <span className="text-white font-medium truncate block" title={assignedDriver?.full_name ?? "Unassigned"}>
                      {assignedDriver?.full_name ?? "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Capacity</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-gold" /> {vehicle.capacity} PAX
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Base Rate</span>
                    <span className="text-white font-medium">
                      {formatMoney(vehicle.base_rate)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] text-muted-foreground">{tripsCompleted} total trips</span>
                  <button className="text-[11px] text-gold hover:underline uppercase tracking-wider">Manage Unit →</button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground border border-dashed border-border">
            No vehicles match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
