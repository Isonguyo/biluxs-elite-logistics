import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  Calendar,
  Car,
  Clock,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";

type VehicleStatus = "available" | "in_use" | "maintenance" | "reserved";

type DriverRow = {
  id: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  plate_number: string | null;
  vehicle_model: string | null;
  availability: string | null;
  verified: boolean | null;
  luxury_certified: boolean | null;
  rating: number | null;
};

type BookingRow = {
  id: string;
  waybill_code: string | null;
  driver_id: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_time: string | null;
  status: string | null;
  updated_at: string | null;
};

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  category: string;
  status: VehicleStatus;
  image: string | null;
  driver: DriverRow | null;
  nextBooking: BookingRow | null;
  currentBooking: BookingRow | null;
  tripsCompleted: number;
  fuelBattery: number | null;
  nextService: string | null;
};

const ACTIVE_BOOKING_STATUSES = new Set(["confirmed", "pending", "in_progress", "assigned"]);
const COMPLETED_BOOKING_STATUSES = new Set(["completed"]);
const MAINTENANCE_DRIVER_STATUSES = new Set(["maintenance", "service", "unavailable_maintenance"]);
const OFFLINE_DRIVER_STATUSES = new Set(["offline", "break", "emergency"]);

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function inferCategory(model: string | null) {
  const value = String(model ?? "").toLowerCase();
  if (/(sprinter|van|minibus|bus)/.test(value)) return "Sprinter Van";
  if (/(suv|cullinan|escalade|range rover|gle|gls|lx|x7)/.test(value)) return "Luxury SUV";
  if (/(maybach|s-class|7 series|a8|panamera|continental|phantom|sedan)/.test(value)) return "First Class";
  return "Business Sedan";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isFutureOrActiveBooking(booking: BookingRow) {
  const status = normalizeStatus(booking.status);
  return ACTIVE_BOOKING_STATUSES.has(status);
}

function getVehicleStatus(
  driver: DriverRow,
  currentBooking: BookingRow | null,
  nextBooking: BookingRow | null,
): VehicleStatus {
  const availability = normalizeStatus(driver.availability);

  if (MAINTENANCE_DRIVER_STATUSES.has(availability)) return "maintenance";
  if (currentBooking?.status && normalizeStatus(currentBooking.status) === "in_progress") return "in_use";
  if (currentBooking) return "reserved";
  if (nextBooking) return "reserved";
  return "available";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DR";
}

export function AdminVehicles() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFleet = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    const [driversResult, bookingsResult] = await Promise.all([
      supabase
        .from("drivers")
        .select(
          "id,full_name,phone,photo_url,plate_number,vehicle_model,availability,verified,luxury_certified,rating",
        )
        .order("full_name", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          "id,waybill_code,driver_id,pickup_location,dropoff_location,pickup_time,status,updated_at",
        )
        .order("pickup_time", { ascending: true, nullsFirst: false }),
    ]);

    if (driversResult.error) {
      const message = driversResult.error.message || "Unable to load fleet data.";
      setLoadError(message);
      toast.error(message);
    }

    if (bookingsResult.error) {
      const message = bookingsResult.error.message || "Unable to load booking usage data.";
      setLoadError((previous) => previous ?? message);
      toast.error(message);
    }

    if (!driversResult.error) setDrivers((driversResult.data as DriverRow[]) ?? []);
    if (!bookingsResult.error) setBookings((bookingsResult.data as BookingRow[]) ?? []);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadFleet();

    const channel = supabase
      .channel(rtTopic("admin-vehicles"))
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => void loadFleet(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void loadFleet(true))
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadFleet]);

  const vehicles = useMemo<Vehicle[]>(() => {
    return drivers
      .filter((driver) => driver.vehicle_model || driver.plate_number)
      .map((driver) => {
        const driverBookings = bookings
          .filter((booking) => booking.driver_id === driver.id)
          .sort((a, b) => {
            const aTime = a.pickup_time ? new Date(a.pickup_time).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.pickup_time ? new Date(b.pickup_time).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          });

        const currentBooking = driverBookings.find((booking) => {
          const status = normalizeStatus(booking.status);
          return status === "in_progress";
        }) ?? null;

        const nextBooking = driverBookings.find((booking) => {
          if (!isFutureOrActiveBooking(booking)) return false;
          if (currentBooking?.id === booking.id) return false;
          if (!booking.pickup_time) return true;
          const pickup = new Date(booking.pickup_time).getTime();
          return pickup >= Date.now();
        }) ?? null;

        const tripsCompleted = driverBookings.filter((booking) =>
          COMPLETED_BOOKING_STATUSES.has(normalizeStatus(booking.status)),
        ).length;

        const status = getVehicleStatus(driver, currentBooking, nextBooking);

        return {
          id: driver.id,
          name: driver.vehicle_model || "Vehicle not specified",
          plate: driver.plate_number || "No plate recorded",
          category: inferCategory(driver.vehicle_model),
          status,
          image: null,
          driver,
          nextBooking,
          currentBooking,
          tripsCompleted,
          fuelBattery: null,
          nextService: null,
        };
      });
  }, [drivers, bookings]);

  const filteredVehicles = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesFilter = filter === "all" || vehicle.status === filter;
      const matchesSearch =
        !needle ||
        vehicle.name.toLowerCase().includes(needle) ||
        vehicle.plate.toLowerCase().includes(needle) ||
        vehicle.driver?.full_name?.toLowerCase().includes(needle);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, vehicles]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      available: vehicles.filter((vehicle) => vehicle.status === "available").length,
      inUse: vehicles.filter((vehicle) => vehicle.status === "in_use").length,
      reserved: vehicles.filter((vehicle) => vehicle.status === "reserved").length,
      maintenance: vehicles.filter((vehicle) => vehicle.status === "maintenance").length,
    }),
    [vehicles],
  );

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> Available
          </span>
        );
      case "in_use":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
            <Car className="w-3 h-3" /> Active Trip
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-crimson/10 text-crimson border border-crimson/20">
            <Wrench className="w-3 h-3" /> Maintenance
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-3 h-3" /> Reserved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Fleet", stats.total, "text-white"],
          ["Available", stats.available, "text-emerald-400"],
          ["Active", stats.inUse, "text-gold"],
          ["Reserved", stats.reserved, "text-blue-400"],
          ["Maintenance", stats.maintenance, "text-crimson"],
        ].map(([label, value, tone]) => (
          <div key={label} className="border border-border bg-card p-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-display ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vehicle, plate or driver..."
              className="h-9 pl-9 pr-4 bg-white/[0.03] border border-border text-xs focus:border-gold outline-none w-full sm:w-72"
            />
          </div>

          <div className="flex overflow-x-auto border border-border bg-white/[0.02] p-0.5 text-xs">
            {["all", "available", "in_use", "reserved", "maintenance"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 capitalize whitespace-nowrap transition-colors ${
                  filter === status ? "bg-gold/20 text-gold" : "text-muted-foreground hover:text-white"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadFleet(true)}
          disabled={refreshing}
          className="h-9 px-4 border border-border text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-muted-foreground hover:text-white hover:border-gold/50 disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh fleet
        </button>
      </div>

      {loadError && (
        <div className="border border-crimson/30 bg-crimson/5 px-4 py-3 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-crimson mt-0.5 shrink-0" />
          <div>
            <div className="text-crimson font-medium">Fleet data could not be fully loaded</div>
            <div className="text-muted-foreground text-xs mt-1">{loadError}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-44 border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="border border-border bg-card p-10 text-center">
          <Car className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <div className="mt-3 text-sm text-white">No fleet vehicles match this view</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Vehicles on this screen are derived from driver vehicle assignments stored in BiLUXS.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="border border-border bg-card p-4 flex flex-col sm:flex-row gap-4 hover:border-gold/50 transition-colors"
            >
              <div className="w-full sm:w-48 h-32 relative shrink-0 bg-black/40 border border-border/50 overflow-hidden">
                {vehicle.image ? (
                  <img src={vehicle.image} alt={vehicle.driver?.full_name || vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                    <Car className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-gold border border-gold/30">
                  {vehicle.plate}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-base text-white truncate">{vehicle.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{vehicle.category}</p>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-border/50 text-[11px]">
                  <div className="min-w-0">
                    <span className="text-muted-foreground block text-[9px] uppercase">Assigned Driver</span>
                    <span className="text-white font-medium truncate block">
                      {vehicle.driver?.full_name ?? "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Vehicle Data</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3 text-gold" /> Not tracked
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Service</span>
                    <span className="text-white font-medium">Not tracked</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {vehicle.tripsCompleted} completed trips
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="text-[11px] text-gold hover:underline uppercase tracking-wider whitespace-nowrap"
                  >
                    Manage Unit →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-gold">Fleet unit</div>
                <h2 className="font-display text-xl text-white mt-1">{selectedVehicle.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="p-2 text-muted-foreground hover:text-white"
                aria-label="Close vehicle details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 h-32 bg-black/40 border border-border overflow-hidden shrink-0">
                  {selectedVehicle.image ? (
                    <img
                      src={selectedVehicle.image}
                      alt={selectedVehicle.driver?.full_name || selectedVehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1 text-sm">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Plate</div>
                    <div className="text-white mt-1 font-mono">{selectedVehicle.plate}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Status</div>
                    <div className="mt-1">{getStatusBadge(selectedVehicle.status)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Category</div>
                    <div className="text-white mt-1">{selectedVehicle.category}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Completed trips</div>
                    <div className="text-white mt-1">{selectedVehicle.tripsCompleted}</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-border p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gold">
                    <UserRound className="w-3.5 h-3.5" /> Assigned driver
                  </div>
                  {selectedVehicle.driver ? (
                    <div className="mt-3 flex items-center gap-3">
                      {selectedVehicle.driver.photo_url ? (
                        <img
                          src={selectedVehicle.driver.photo_url}
                          alt={selectedVehicle.driver.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-border bg-white/[0.03] flex items-center justify-center text-xs text-gold">
                          {getInitials(selectedVehicle.driver.full_name)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-white">{selectedVehicle.driver.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedVehicle.driver.phone || "No phone recorded"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-3">No driver assigned.</div>
                  )}
                </div>

                <div className="border border-border p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-blue-400">
                    <Clock className="w-3.5 h-3.5" /> Current / next assignment
                  </div>
                  {selectedVehicle.currentBooking ? (
                    <div className="mt-3">
                      <div className="text-sm text-white">{selectedVehicle.currentBooking.waybill_code || selectedVehicle.currentBooking.id}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedVehicle.currentBooking.pickup_location || "Pickup not recorded"} → {selectedVehicle.currentBooking.dropoff_location || "Drop-off not recorded"}
                      </div>
                      <div className="text-[10px] text-gold mt-2">{formatDateTime(selectedVehicle.currentBooking.pickup_time)}</div>
                    </div>
                  ) : selectedVehicle.nextBooking ? (
                    <div className="mt-3">
                      <div className="text-sm text-white">{selectedVehicle.nextBooking.waybill_code || selectedVehicle.nextBooking.id}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedVehicle.nextBooking.pickup_location || "Pickup not recorded"} → {selectedVehicle.nextBooking.dropoff_location || "Drop-off not recorded"}
                      </div>
                      <div className="text-[10px] text-gold mt-2">{formatDateTime(selectedVehicle.nextBooking.pickup_time)}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-3">No active or upcoming booking.</div>
                  )}
                </div>
              </div>

              <div className="border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  Fuel/battery percentage and service dates are not being fabricated here because they are not exposed by the verified backend fields currently used by BiLUXS. Add those fields to the fleet backend later if you want them tracked here.
                  <div className="mt-2 text-[10px] text-amber-300/80">Last booking update: {formatDate(selectedVehicle.nextBooking?.updated_at || selectedVehicle.currentBooking?.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
