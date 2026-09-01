-- 1. Avatar storage policies (private bucket "avatars", owner-scoped writes, authenticated reads)
CREATE POLICY "avatars read authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "avatars insert own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars delete own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Notification context columns
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id uuid;

-- 3. Reviews: moderation status + one review per completed booking
ALTER TABLE public.driver_reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS driver_reviews_one_per_booking
  ON public.driver_reviews (booking_id, reviewer_id) WHERE booking_id IS NOT NULL;

DROP POLICY IF EXISTS "Customers create own reviews" ON public.driver_reviews;
CREATE POLICY "Customers review own completed rides" ON public.driver_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = driver_reviews.booking_id
        AND b.user_id = auth.uid()
        AND b.status = 'completed'
        AND b.driver_id = driver_reviews.driver_id
    )
  );

-- 4. Conversations / messages: scope drivers to their own assigned bookings
DROP POLICY IF EXISTS "conv participant read" ON public.conversations;
CREATE POLICY "conv participant read" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_user')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.drivers d ON d.id = b.driver_id
      WHERE b.id = conversations.booking_id AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "msg participant read" ON public.messages;
CREATE POLICY "msg participant read" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.user_id = auth.uid()
        OR public.has_role(auth.uid(),'admin')
        OR public.has_role(auth.uid(),'super_user')
        OR EXISTS (
          SELECT 1 FROM public.bookings b
          JOIN public.drivers d ON d.id = b.driver_id
          WHERE b.id = c.booking_id AND d.user_id = auth.uid()
        )
      )
  ));

DROP POLICY IF EXISTS "msg participant insert" ON public.messages;
CREATE POLICY "msg participant insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.user_id = auth.uid()
          OR public.has_role(auth.uid(),'admin')
          OR public.has_role(auth.uid(),'super_user')
          OR EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.drivers d ON d.id = b.driver_id
            WHERE b.id = c.booking_id AND d.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "conv owner delete" ON public.conversations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));

-- 5. Chat lifecycle: remove the ride chat once the ride completes
CREATE OR REPLACE FUNCTION public.purge_ride_chat_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    DELETE FROM public.messages m
      USING public.conversations c
      WHERE m.conversation_id = c.id AND c.booking_id = NEW.id AND c.channel = 'driver';
    DELETE FROM public.conversations c WHERE c.booking_id = NEW.id AND c.channel = 'driver';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bookings_purge_chat ON public.bookings;
CREATE TRIGGER bookings_purge_chat AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.purge_ride_chat_on_complete();

-- 6. Richer customer notifications with booking context
CREATE OR REPLACE FUNCTION public.notify_on_driver_assign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _label text;
BEGIN
  IF NEW.driver_id IS NOT NULL AND NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    INSERT INTO public.trip_events(booking_id, event, note) VALUES (NEW.id, 'assigned', 'Chauffeur assigned to your journey');
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
      VALUES (NEW.user_id,
              CASE WHEN OLD.driver_id IS NULL THEN 'Your chauffeur has been assigned.' ELSE 'Your chauffeur has been changed.' END,
              'Open your ride to see your chauffeur, vehicle and live location.',
              'trip', '/portal/trips/' || NEW.id::text, NEW.id);
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    _label := CASE NEW.status::text
      WHEN 'confirmed' THEN 'Your ride is confirmed.'
      WHEN 'in_progress' THEN 'Your ride is in progress.'
      WHEN 'completed' THEN 'Your ride is complete.'
      WHEN 'cancelled' THEN 'Your ride was cancelled.'
      ELSE 'Your ride was updated.' END;
    INSERT INTO public.trip_events(booking_id, event, note) VALUES (NEW.id, NEW.status::text, NULL);
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
      VALUES (NEW.user_id, _label,
              NEW.pickup_location || ' to ' || NEW.dropoff_location,
              'trip', '/portal/trips/' || NEW.id::text, NEW.id);
  END IF;

  IF NEW.driver_lat_lng IS NOT NULL AND OLD.driver_lat_lng IS NULL THEN
    INSERT INTO public.notifications(user_id, title, body, kind, link, booking_id)
      VALUES (NEW.user_id, 'Live tracking has started.', 'You can now follow your chauffeur on the map.', 'trip',
              '/portal/trips/' || NEW.id::text, NEW.id);
  END IF;

  RETURN NEW;
END; $$;
