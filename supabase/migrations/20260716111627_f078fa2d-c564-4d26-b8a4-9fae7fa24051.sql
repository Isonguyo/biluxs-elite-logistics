
-- ============ contact_messages ============
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and super users view messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Admins and super users update messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Super users delete messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_user'));

-- Realtime for the messages inbox
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;

-- ============ driver_reviews ============
CREATE TABLE public.driver_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX driver_reviews_driver_idx ON public.driver_reviews(driver_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_reviews TO authenticated;
GRANT ALL ON public.driver_reviews TO service_role;
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers create own reviews"
  ON public.driver_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Customers view own reviews"
  ON public.driver_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins and super users view all reviews"
  ON public.driver_reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Drivers view own reviews"
  ON public.driver_reviews FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = driver_reviews.driver_id AND d.user_id = auth.uid()
  ));

-- ============ Tighten user_roles: remove admin write access ============
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

-- Admins keep read visibility for the roster; only super users can modify roles.
CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_user'));

-- ============ Profiles: super user visibility ============
DROP POLICY IF EXISTS "Super users view all profiles" ON public.profiles;
CREATE POLICY "Super users view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_user'));

-- ============ Driver stats view ============
CREATE OR REPLACE VIEW public.driver_stats
WITH (security_invoker = true)
AS
SELECT
  d.id AS driver_id,
  d.full_name,
  d.phone,
  d.status,
  d.rating AS base_rating,
  COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed_rides,
  COUNT(b.id) FILTER (WHERE b.status = 'in_progress') AS active_rides,
  COALESCE(AVG(r.rating), d.rating) AS avg_rating,
  COUNT(r.id) AS review_count
FROM public.drivers d
LEFT JOIN public.bookings b ON b.driver_id = d.id
LEFT JOIN public.driver_reviews r ON r.driver_id = d.id
GROUP BY d.id;

GRANT SELECT ON public.driver_stats TO authenticated;
