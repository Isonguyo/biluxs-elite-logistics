CREATE OR REPLACE FUNCTION public.get_booking_driver(_booking_id uuid)
RETURNS TABLE (
  id uuid, full_name text, photo_url text, phone text, whatsapp text,
  vehicle_model text, plate_number text, rating numeric, years_experience int,
  verified boolean, status public.driver_status, lat_lng jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = _booking_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'))
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.id, d.full_name, d.photo_url, d.phone, d.whatsapp, d.vehicle_model,
         d.plate_number, d.rating, d.years_experience, d.verified, d.status,
         b.driver_lat_lng::jsonb
  FROM public.bookings b
  JOIN public.drivers d ON d.id = b.driver_id
  WHERE b.id = _booking_id;
END; $$;

REVOKE ALL ON FUNCTION public.get_booking_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_driver(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_on_driver_assign()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL AND NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    INSERT INTO public.trip_events(booking_id, event, note) VALUES (NEW.id, 'assigned', 'Chauffeur assigned to your journey');
    INSERT INTO public.notifications(user_id, title, body, kind, link)
      VALUES (NEW.user_id, 'Chauffeur assigned',
              'A chauffeur has been assigned to your trip ' || NEW.waybill_code || '.',
              'trip', '/portal/trips/' || NEW.id::text);
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.trip_events(booking_id, event, note) VALUES (NEW.id, NEW.status::text, NULL);
    INSERT INTO public.notifications(user_id, title, body, kind, link)
      VALUES (NEW.user_id, 'Trip ' || replace(NEW.status::text,'_',' '),
              'Your trip ' || NEW.waybill_code || ' is now ' || replace(NEW.status::text,'_',' ') || '.',
              'trip', '/portal/trips/' || NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_on_driver_assign() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS bookings_notify ON public.bookings;
CREATE TRIGGER bookings_notify AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_on_driver_assign();