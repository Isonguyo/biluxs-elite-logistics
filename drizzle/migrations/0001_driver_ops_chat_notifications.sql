-- Allow the assigned driver to open the ride conversation if the customer hasn't yet
CREATE POLICY "conv assigned driver insert" ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (
  booking_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.drivers d ON d.id = b.driver_id
    WHERE b.id = conversations.booking_id AND d.user_id = auth.uid()
  )
);

-- Purge both ride chat and dispatch chat attached to a booking once it completes
CREATE OR REPLACE FUNCTION public.purge_ride_chat_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    DELETE FROM public.messages m
      USING public.conversations c
      WHERE m.conversation_id = c.id AND c.booking_id = NEW.id AND c.channel IN ('driver','dispatch');
    DELETE FROM public.conversations c WHERE c.booking_id = NEW.id AND c.channel IN ('driver','dispatch');
  END IF;
  RETURN NEW;
END; $function$;

-- Notify the assigned chauffeur about their own assignments
CREATE OR REPLACE FUNCTION public.notify_driver_on_assign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _uid uuid;
BEGIN
  IF NEW.driver_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO _uid FROM public.drivers WHERE id = NEW.driver_id;
  IF _uid IS NULL THEN RETURN NEW; END IF;

  IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
    VALUES (_uid, 'New ride assigned',
            NEW.waybill_code || ' · ' || NEW.pickup_location || ' to ' || NEW.dropoff_location,
            'assignment', '/driver', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
    VALUES (_uid, 'Assignment ' || NEW.status::text,
            NEW.waybill_code || ' · ' || NEW.pickup_location || ' to ' || NEW.dropoff_location,
            'assignment', '/driver', NEW.id);
  ELSIF NEW.pickup_time IS DISTINCT FROM OLD.pickup_time THEN
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
    VALUES (_uid, 'Schedule changed',
            NEW.waybill_code || ' · new pickup time',
            'assignment', '/driver', NEW.id);
  END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS bookings_notify_driver ON public.bookings;
CREATE TRIGGER bookings_notify_driver
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_driver_on_assign();