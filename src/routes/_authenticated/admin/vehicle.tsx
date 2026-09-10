import { useState } from "react";
import { Car, ShieldCheck, Wrench, AlertTriangle, BatteryCharging, Calendar, Search, Filter, Plus } from "lucide-react";

type VehicleStatus = "available" | "in_use" | "maintenance" | "reserved";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  category: "First Class" | "Business Sedan" | "Luxury SUV" | "Sprinter Van";
  status: VehicleStatus;
  image: string;
  driver: string | null;
  fuelBattery: number; // percentage
  nextService: string;
  tripsCompleted: number;
}

const initialVehicles: Vehicle[] = [
  {
    id: "v-1",
    name: "Maybach S-Class 680",
    plate: "LUX-8801",
    category: "First Class",
    status: "in_use",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80",
    driver: "Marcus Vance",
    fuelBattery: 85,
    nextService: "2026-10-15",
    tripsCompleted: 142,
  },
  {
    id: "v-2",
    name: "Rolls-Royce Cullinan",
    plate: "LUX-0001",
    category: "Luxury SUV",
    status: "available",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    driver: null,
    fuelBattery: 98,
    nextService: "2026-11-01",
    tripsCompleted: 89,
  },
  {
    id: "v-3",
    name: "Cadillac Escalade ESV",
    plate: "LUX-4420",
    category: "Luxury SUV",
    status: "maintenance",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    driver: null,
    fuelBattery: 40,
    nextService: "Today",
    tripsCompleted: 210,
  },
  {
    id: "v-4",
    name: "Mercedes-AMG Sprinter VIP",
    plate: "LUX-9900",
    category: "Sprinter Van",
    status: "reserved",
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
    driver: "Elena Rostova",
    fuelBattery: 92,
    nextService: "2026-12-05",
    tripsCompleted: 64,
  },
];

export function AdminVehicles() {
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === "all" || v.status === filter;
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case "available":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Available</span>;
      case "in_use":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-gold/10 text-gold border border-gold/20"><Car className="w-3 h-3" /> Active Trip</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-crimson/10 text-crimson border border-crimson/20"><Wrench className="w-3 h-3" /> Maintenance</span>;
      case "reserved":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20"><Calendar className="w-3 h-3" /> Reserved</span>;
    }
  };

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
              placeholder="Search vehicle or plate..."
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
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="border border-border bg-card p-4 flex flex-col sm:flex-row gap-4 hover:border-gold/50 transition-colors">
            <div className="w-full sm:w-48 h-32 relative shrink-0 bg-black/40 border border-border/50 overflow-hidden">
              <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-gold border border-gold/30">
                {vehicle.plate}
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
                  <span className="text-white font-medium truncate block">{vehicle.driver ?? "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Fuel / Range</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-gold" /> {vehicle.fuelBattery}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Next Service</span>
                  <span className={`font-medium ${vehicle.nextService === "Today" ? "text-crimson" : "text-white"}`}>
                    {vehicle.nextService}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-muted-foreground">{vehicle.tripsCompleted} total trips</span>
                <button className="text-[11px] text-gold hover:underline uppercase tracking-wider">Manage Unit →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
