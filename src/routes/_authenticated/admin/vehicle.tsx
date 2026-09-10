import { useState, useEffect } from "react";
import { Car, ShieldCheck, Wrench, Users, Calendar, Search, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AdminVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Business Sedan",
    capacity: 4,
    base_rate: 150000,
    per_km_rate: 5000,
    status: "available",
    image_url: "",
    description: "",
    features: "", 
  });

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

    const subscription = supabase
      .channel("vehicles-admin-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        loadFleet();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert comma-separated features into a JSON array
      const featuresArray = formData.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const { error } = await supabase.from("vehicles").insert({
        name: formData.name,
        category: formData.category,
        capacity: Number(formData.capacity),
        base_rate: Number(formData.base_rate),
        per_km_rate: Number(formData.per_km_rate),
        status: formData.status,
        image_url: formData.image_url || null,
        description: formData.description || null,
        features: featuresArray,
      });

      if (error) throw error;

      toast.success("Vehicle added to fleet");
      setIsAdding(false);
      setFormData({
        name: "", category: "Business Sedan", capacity: 4, base_rate: 150000, per_km_rate: 5000, status: "available", image_url: "", description: "", features: ""
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <button 
          onClick={() => setIsAdding(true)}
          className="h-9 px-4 bg-gold text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-2 hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => {
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

      {/* Add Vehicle Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white">Add New Vehicle</h2>
              <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle} className="p-4 overflow-y-auto space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Vehicle Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mercedes S-Class 2024" className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category *</label>
                  <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold">
                    <option value="First Class">First Class</option>
                    <option value="Business Sedan">Business Sedan</option>
                    <option value="Luxury SUV">Luxury SUV</option>
                    <option value="Sprinter Van">Sprinter Van</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Base Rate (NGN) *</label>
                  <input required type="number" min="0" value={formData.base_rate} onChange={(e) => setFormData({...formData, base_rate: Number(e.target.value)})} className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Per KM Rate (NGN) *</label>
                  <input required type="number" min="0" value={formData.per_km_rate} onChange={(e) => setFormData({...formData, per_km_rate: Number(e.target.value)})} className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Passenger Capacity *</label>
                  <input required type="number" min="1" max="50" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold">
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Image URL</label>
                <input type="url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Features (Comma separated)</label>
                <input value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} placeholder="WiFi, Massage Seats, Champagne Cooler" className="w-full h-9 px-3 bg-input border border-border text-xs text-white outline-none focus:border-gold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Internal notes or vehicle description..." className="w-full p-3 bg-input border border-border text-xs text-white outline-none focus:border-gold resize-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button type="button" onClick={() => setIsAdding(false)} className="h-9 px-4 text-xs font-medium text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="h-9 px-6 bg-gold text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center min-w-[120px] hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
