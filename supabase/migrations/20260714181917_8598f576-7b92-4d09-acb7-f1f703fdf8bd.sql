
-- Bookings: payment + QR + live driver location
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_ref text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS qr_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS qr_status text NOT NULL DEFAULT 'valid',
  ADD COLUMN IF NOT EXISTS qr_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_lat_lng jsonb;

-- Drivers: link to auth user so a signed-in driver can be identified
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Alerts feed for admin command center
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and super users view all alerts"
ON public.alerts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Drivers insert their own scan alerts"
ON public.alerts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'driver') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

-- Realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Super user: full access override on bookings
CREATE POLICY "Super users view all bookings"
ON public.bookings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Super users manage all bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_user'))
WITH CHECK (public.has_role(auth.uid(), 'super_user'));

-- Drivers can view + update bookings assigned to them (for status/location updates)
CREATE POLICY "Drivers view assigned bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = bookings.driver_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers update assigned bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = bookings.driver_id AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = bookings.driver_id AND d.user_id = auth.uid()
  )
);

-- Drivers can read their own driver row (needed to know their driver_id)
CREATE POLICY "Drivers view own record"
ON public.drivers FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

-- Super users manage roles
CREATE POLICY "Super users manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_user'))
WITH CHECK (public.has_role(auth.uid(), 'super_user'));

-- Secure QR scan RPC: verifies + invalidates atomically
CREATE OR REPLACE FUNCTION public.scan_booking_qr(_qr_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id uuid;
  v_booking record;
BEGIN
  -- Only drivers/admins/super_users can scan
  IF NOT (public.has_role(auth.uid(), 'driver') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = auth.uid();

  SELECT * INTO v_booking FROM public.bookings WHERE qr_token = _qr_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_booking.qr_status = 'used' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used', 'waybill', v_booking.waybill_code);
  END IF;

  IF v_booking.payment_status <> 'paid' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_paid', 'waybill', v_booking.waybill_code);
  END IF;

  UPDATE public.bookings
    SET qr_status = 'used',
        qr_verified_at = now(),
        status = 'in_progress',
        driver_id = COALESCE(driver_id, v_driver_id),
        updated_at = now()
    WHERE id = v_booking.id;

  INSERT INTO public.alerts (kind, title, body, booking_id, driver_id, metadata)
  VALUES (
    'qr_verified',
    'Passenger Verified',
    'Waybill ' || v_booking.waybill_code || ' — passenger verified & in transit.',
    v_booking.id,
    COALESCE(v_booking.driver_id, v_driver_id),
    jsonb_build_object('waybill', v_booking.waybill_code)
  );

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking.id, 'waybill', v_booking.waybill_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.scan_booking_qr(uuid) TO authenticated;
