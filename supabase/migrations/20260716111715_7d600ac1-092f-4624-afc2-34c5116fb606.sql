
CREATE OR REPLACE FUNCTION public.scan_booking_qr(_qr_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_driver_id uuid;
  v_booking record;
  v_profile record;
BEGIN
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

  SELECT full_name, phone INTO v_profile FROM public.profiles WHERE id = v_booking.user_id;

  INSERT INTO public.alerts (kind, title, body, booking_id, driver_id, metadata)
  VALUES (
    'qr_verified',
    'Passenger Verified',
    'Waybill ' || v_booking.waybill_code || ' — passenger verified & in transit.',
    v_booking.id,
    COALESCE(v_booking.driver_id, v_driver_id),
    jsonb_build_object('waybill', v_booking.waybill_code)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'booking_id', v_booking.id,
    'waybill', v_booking.waybill_code,
    'pickup', v_booking.pickup_location,
    'dropoff', v_booking.dropoff_location,
    'pickup_time', v_booking.pickup_time,
    'passenger_name', COALESCE(v_profile.full_name, 'Guest'),
    'passenger_phone', v_profile.phone,
    'total', v_booking.total_price,
    'luxury', v_booking.luxury_protocol
  );
END;
$function$;
