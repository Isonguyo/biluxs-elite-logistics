-- ============ scheduling window helper ============
CREATE OR REPLACE FUNCTION public.booking_window(_pickup timestamptz, _distance numeric)
RETURNS tstzrange
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT tstzrange(
    _pickup - interval '30 minutes',
    _pickup + greatest(interval '45 minutes', (coalesce(_distance,0) / 40.0) * interval '1 hour') + interval '30 minutes',
    '[)'
  )
$$;

-- ============ explainable driver trust score ============
CREATE OR REPLACE VIEW public.driver_trust
WITH (security_invoker = true) AS
SELECT
  d.id AS driver_id,
  d.full_name,
  count(b.id) FILTER (WHERE b.status = 'completed')                            AS completed_rides,
  count(b.id) FILTER (WHERE b.status = 'cancelled')                            AS cancelled_rides,
  count(b.id) FILTER (WHERE b.qr_status = 'used')                              AS verified_rides,
  count(DISTINCT r.id) FILTER (WHERE r.status = 'approved')                    AS review_count,
  round(coalesce(avg(r.rating) FILTER (WHERE r.status = 'approved'), d.rating), 2) AS avg_rating,
  count(DISTINCT i.id) FILTER (WHERE i.resolved = false)                       AS open_incidents,
  count(DISTINCT i.id)                                                          AS total_incidents,
  greatest(0, least(100, round(
      (coalesce(avg(r.rating) FILTER (WHERE r.status = 'approved'), d.rating) / 5.0) * 55
    + least(20, count(b.id) FILTER (WHERE b.status = 'completed') * 1.0)
    + least(15, count(b.id) FILTER (WHERE b.qr_status = 'used') * 1.0)
    + CASE WHEN d.verified THEN 10 ELSE 0 END
    - count(DISTINCT i.id) * 4
    - count(b.id) FILTER (WHERE b.status = 'cancelled') * 2
  )))::int AS trust_score
FROM public.drivers d
LEFT JOIN public.bookings b ON b.driver_id = d.id
LEFT JOIN public.driver_reviews r ON r.driver_id = d.id
LEFT JOIN public.driver_incidents i ON i.driver_id = d.id
GROUP BY d.id;

GRANT SELECT ON public.driver_trust TO authenticated;

-- ============ conflict-safe driver assignment ============
CREATE OR REPLACE FUNCTION public.admin_assign_driver(_booking_id uuid, _driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE b record; d record; c record; win tstzrange;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found'); END IF;

  IF _driver_id IS NULL THEN
    UPDATE public.bookings SET driver_id = NULL, updated_at = now() WHERE id = _booking_id;
    RETURN jsonb_build_object('ok', true, 'unassigned', true);
  END IF;

  SELECT * INTO d FROM public.drivers WHERE id = _driver_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'driver_not_found'); END IF;
  IF d.status <> 'active' OR d.availability = 'unavailable' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'driver_unavailable', 'driver', d.full_name);
  END IF;

  win := public.booking_window(b.pickup_time, b.distance_km);

  SELECT o.id, o.waybill_code, o.pickup_time, o.distance_km INTO c
  FROM public.bookings o
  WHERE o.driver_id = _driver_id
    AND o.id <> _booking_id
    AND o.status IN ('pending','confirmed','in_progress')
    AND public.booking_window(o.pickup_time, o.distance_km) && win
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'conflict', 'driver', d.full_name,
      'waybill', c.waybill_code, 'pickup_time', c.pickup_time,
      'until', upper(public.booking_window(c.pickup_time, c.distance_km)));
  END IF;

  UPDATE public.bookings SET driver_id = _driver_id, updated_at = now() WHERE id = _booking_id;
  RETURN jsonb_build_object('ok', true, 'driver', d.full_name);
END; $$;

REVOKE ALL ON FUNCTION public.admin_assign_driver(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_driver(uuid, uuid) TO authenticated;

-- ============ conflict-safe vehicle assignment ============
CREATE OR REPLACE FUNCTION public.admin_set_vehicle(_booking_id uuid, _vehicle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE b record; v record; c record; win tstzrange;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found'); END IF;

  IF _vehicle_id IS NULL THEN
    UPDATE public.bookings SET vehicle_id = NULL, updated_at = now() WHERE id = _booking_id;
    RETURN jsonb_build_object('ok', true, 'cleared', true);
  END IF;

  SELECT * INTO v FROM public.vehicles WHERE id = _vehicle_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'vehicle_not_found'); END IF;
  IF v.status = 'maintenance' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'vehicle_unavailable', 'vehicle', v.name);
  END IF;

  win := public.booking_window(b.pickup_time, b.distance_km);

  SELECT o.id, o.waybill_code, o.pickup_time INTO c
  FROM public.bookings o
  WHERE o.vehicle_id = _vehicle_id
    AND o.id <> _booking_id
    AND o.status IN ('pending','confirmed','in_progress')
    AND public.booking_window(o.pickup_time, o.distance_km) && win
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'conflict', 'vehicle', v.name,
      'waybill', c.waybill_code, 'pickup_time', c.pickup_time);
  END IF;

  UPDATE public.bookings SET vehicle_id = _vehicle_id, updated_at = now() WHERE id = _booking_id;
  RETURN jsonb_build_object('ok', true, 'vehicle', v.name);
END; $$;

REVOKE ALL ON FUNCTION public.admin_set_vehicle(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_vehicle(uuid, uuid) TO authenticated;

-- ============ targeted operational notifications for staff ============
CREATE OR REPLACE FUNCTION public.notify_ops(_title text, _body text, _kind text, _link text, _booking uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
  SELECT DISTINCT ur.user_id, _title, _body, _kind, _link, _booking
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_user');
$$;

CREATE OR REPLACE FUNCTION public.ops_on_booking_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.notify_ops('New booking received',
    NEW.waybill_code || ' · ' || NEW.pickup_location || ' to ' || NEW.dropoff_location,
    'booking', '/admin/bookings/' || NEW.id::text, NEW.id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_booking_insert ON public.bookings;
CREATE TRIGGER ops_booking_insert AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.ops_on_booking_insert();

CREATE OR REPLACE FUNCTION public.ops_on_booking_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE vname text;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    PERFORM public.notify_ops('Payment confirmed',
      NEW.waybill_code || ' payment confirmed', 'payment',
      '/admin/bookings/' || NEW.id::text, NEW.id);
  END IF;

  IF NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id AND NEW.vehicle_id IS NOT NULL THEN
    SELECT name INTO vname FROM public.vehicles WHERE id = NEW.vehicle_id;
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
    VALUES (NEW.user_id, 'Vehicle changed',
      'Your vehicle for ' || NEW.waybill_code || ' is now ' || coalesce(vname,'updated') || '.',
      'trip', '/portal/trips/' || NEW.id::text, NEW.id);
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_booking_update ON public.bookings;
CREATE TRIGGER ops_booking_update AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.ops_on_booking_update();

CREATE OR REPLACE FUNCTION public.ops_on_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE dname text;
BEGIN
  SELECT full_name INTO dname FROM public.drivers WHERE id = NEW.driver_id;
  PERFORM public.notify_ops('Driver incident · ' || NEW.severity,
    coalesce(dname,'Chauffeur') || ' · ' || NEW.kind || coalesce(' — ' || NEW.note, ''),
    'incident', '/admin/incidents', NEW.booking_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_incident_insert ON public.driver_incidents;
CREATE TRIGGER ops_incident_insert AFTER INSERT ON public.driver_incidents
FOR EACH ROW EXECUTE FUNCTION public.ops_on_incident();

CREATE OR REPLACE FUNCTION public.ops_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE dname text;
BEGIN
  SELECT full_name INTO dname FROM public.drivers WHERE id = NEW.driver_id;
  PERFORM public.notify_ops('New customer review',
    NEW.rating::text || '★ for ' || coalesce(dname,'chauffeur'),
    'review', '/admin/reviews', NEW.booking_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_review_insert ON public.driver_reviews;
CREATE TRIGGER ops_review_insert AFTER INSERT ON public.driver_reviews
FOR EACH ROW EXECUTE FUNCTION public.ops_on_review();

CREATE OR REPLACE FUNCTION public.ops_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = NEW.conversation_id;
  IF NEW.sender_role IN ('admin','staff') THEN
    IF c.user_id IS NOT NULL AND c.user_id <> NEW.sender_id THEN
      INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
      VALUES (c.user_id, 'Message from BiLUXS', left(NEW.body, 140), 'message',
        CASE WHEN c.booking_id IS NOT NULL THEN '/portal/trips/' || c.booking_id::text ELSE '/portal/messages' END,
        c.booking_id);
    END IF;
  ELSE
    PERFORM public.notify_ops(
      CASE WHEN NEW.sender_role = 'driver' THEN 'Driver message' ELSE 'New customer message' END,
      left(NEW.body, 140), 'message', '/admin/messages', c.booking_id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_message_insert ON public.messages;
CREATE TRIGGER ops_message_insert AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.ops_on_message();
