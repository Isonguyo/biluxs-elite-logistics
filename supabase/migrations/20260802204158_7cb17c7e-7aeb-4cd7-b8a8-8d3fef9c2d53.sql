-- 1. Driver presence
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS luxury_certified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.drivers ADD CONSTRAINT drivers_availability_chk
    CHECK (availability IN ('online','break','busy','offline','emergency'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Shifts
CREATE TABLE IF NOT EXISTS public.driver_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.driver_shifts TO authenticated;
GRANT ALL ON public.driver_shifts TO service_role;
ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;

-- 3. Incidents
CREATE TABLE IF NOT EXISTS public.driver_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  note text,
  lat double precision,
  lng double precision,
  photo_url text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.driver_incidents TO authenticated;
GRANT ALL ON public.driver_incidents TO service_role;
ALTER TABLE public.driver_incidents ENABLE ROW LEVEL SECURITY;

-- 4. Vehicle inspections
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  mileage numeric,
  fuel_level int,
  notes text,
  passed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.vehicle_inspections TO authenticated;
GRANT ALL ON public.vehicle_inspections TO service_role;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- helper: is the current user this driver row?
CREATE OR REPLACE FUNCTION public.is_self_driver(_driver_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = _driver_id AND d.user_id = auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.is_self_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_self_driver(uuid) TO authenticated;

-- policies
DROP POLICY IF EXISTS "driver shifts own" ON public.driver_shifts;
CREATE POLICY "driver shifts own" ON public.driver_shifts FOR ALL TO authenticated
  USING (public.is_self_driver(driver_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'))
  WITH CHECK (public.is_self_driver(driver_id));

DROP POLICY IF EXISTS "driver incidents own" ON public.driver_incidents;
CREATE POLICY "driver incidents own" ON public.driver_incidents FOR ALL TO authenticated
  USING (public.is_self_driver(driver_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'))
  WITH CHECK (public.is_self_driver(driver_id));

DROP POLICY IF EXISTS "inspections insert own" ON public.vehicle_inspections;
CREATE POLICY "inspections insert own" ON public.vehicle_inspections FOR INSERT TO authenticated
  WITH CHECK (public.is_self_driver(driver_id));
DROP POLICY IF EXISTS "inspections read" ON public.vehicle_inspections;
CREATE POLICY "inspections read" ON public.vehicle_inspections FOR SELECT TO authenticated
  USING (public.is_self_driver(driver_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));

-- drivers can update their own presence row
DROP POLICY IF EXISTS "drivers update self" ON public.drivers;
CREATE POLICY "drivers update self" ON public.drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));

-- 5. Earnings view (per driver per day, from paid completed bookings)
CREATE OR REPLACE VIEW public.driver_earnings
WITH (security_invoker = true) AS
SELECT b.driver_id,
       date_trunc('day', COALESCE(b.paid_at, b.updated_at))::date AS day,
       COUNT(*)::int AS trips,
       SUM(b.total_price)::numeric AS gross,
       SUM(b.distance_km)::numeric AS distance_km
FROM public.bookings b
WHERE b.driver_id IS NOT NULL AND b.status = 'completed' AND b.payment_status = 'paid'
GROUP BY 1,2;
GRANT SELECT ON public.driver_earnings TO authenticated;

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_driver_shifts_updated ON public.driver_shifts;
CREATE TRIGGER trg_driver_shifts_updated BEFORE UPDATE ON public.driver_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_driver_incidents_updated ON public.driver_incidents;
CREATE TRIGGER trg_driver_incidents_updated BEFORE UPDATE ON public.driver_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();