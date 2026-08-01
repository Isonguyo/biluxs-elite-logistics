-- ============ PROFILE UPGRADES ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS passport_no text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS preferred_vehicle text,
  ADD COLUMN IF NOT EXISTS preferred_airport text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS travel_preferences text,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{"email":true,"sms":true,"push":true,"whatsapp":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier text NOT NULL DEFAULT 'silver';

-- ============ DRIVER PROFILE EXTRAS ============
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS vehicle_model text,
  ADD COLUMN IF NOT EXISTS plate_number text,
  ADD COLUMN IF NOT EXISTS years_experience integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp text;

-- ============ SHARED TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ WALLETS ============
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet owner read" ON public.wallets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "wallet owner create" ON public.wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "wallet staff update" ON public.wallets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  kind text NOT NULL DEFAULT 'topup',
  status text NOT NULL DEFAULT 'success',
  description text,
  reference text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_tx_user_idx ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx owner read" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));

CREATE OR REPLACE FUNCTION public.wallet_topup(_amount numeric, _reference text DEFAULT NULL, _description text DEFAULT 'Wallet top-up')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _bal numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 5000000 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  INSERT INTO public.wallets(user_id, balance) VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = _uid RETURNING balance INTO _bal;
  INSERT INTO public.wallet_transactions(user_id, amount, kind, status, description, reference)
    VALUES (_uid, _amount, 'topup', 'success', _description, _reference);
  INSERT INTO public.notifications(user_id, title, body, kind)
    VALUES (_uid, 'Wallet topped up', 'Your wallet was credited with ' || _amount::text, 'payment');
  RETURN _bal;
END; $$;

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'general',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif owner read" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "notif owner update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif owner delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif staff insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user') OR public.has_role(auth.uid(),'driver'));

-- ============ MESSAGING ============
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'support',
  subject text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv participant read" ON public.conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user') OR public.has_role(auth.uid(),'driver'));
CREATE POLICY "conv owner insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "conv participant update" ON public.conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role text NOT NULL DEFAULT 'customer',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS msg_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg participant read" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user') OR public.has_role(auth.uid(),'driver'))));
CREATE POLICY "msg participant insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user') OR public.has_role(auth.uid(),'driver'))));

-- ============ TRIP EVENTS ============
CREATE TABLE IF NOT EXISTS public.trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trip_events_idx ON public.trip_events(booking_id, created_at);
GRANT SELECT, INSERT ON public.trip_events TO authenticated;
GRANT ALL ON public.trip_events TO service_role;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip events read" ON public.trip_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id
    AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'))));
CREATE POLICY "trip events insert" ON public.trip_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));

-- ============ SAVED PLACES ============
CREATE TABLE IF NOT EXISTS public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  address text NOT NULL,
  kind text NOT NULL DEFAULT 'favorite',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_places TO authenticated;
GRANT ALL ON public.saved_places TO service_role;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places owner all" ON public.saved_places FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER saved_places_updated BEFORE UPDATE ON public.saved_places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONCIERGE ============
CREATE TABLE IF NOT EXISTS public.concierge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service text NOT NULL,
  details text,
  preferred_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.concierge_requests TO authenticated;
GRANT ALL ON public.concierge_requests TO service_role;
ALTER TABLE public.concierge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "concierge owner read" ON public.concierge_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "concierge owner insert" ON public.concierge_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "concierge staff update" ON public.concierge_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER concierge_updated BEFORE UPDATE ON public.concierge_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CARGO SHIPMENTS ============
CREATE TABLE IF NOT EXISTS public.cargo_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_code text NOT NULL UNIQUE DEFAULT ('BLX-' || upper(substr(md5(random()::text),1,8))),
  origin text NOT NULL,
  destination text NOT NULL,
  weight_kg numeric(10,2),
  description text,
  status text NOT NULL DEFAULT 'pending',
  current_warehouse text,
  estimated_delivery timestamptz,
  proof_of_delivery_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cargo_shipments TO authenticated;
GRANT ALL ON public.cargo_shipments TO service_role;
ALTER TABLE public.cargo_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargo owner read" ON public.cargo_shipments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "cargo owner insert" ON public.cargo_shipments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cargo staff update" ON public.cargo_shipments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER cargo_updated BEFORE UPDATE ON public.cargo_shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TOUR BOOKINGS ============
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  destination text NOT NULL,
  travellers integer NOT NULL DEFAULT 1,
  start_date date,
  end_date date,
  price numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tour_bookings TO authenticated;
GRANT ALL ON public.tour_bookings TO service_role;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tours owner read" ON public.tour_bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "tours owner insert" ON public.tour_bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tours staff update" ON public.tour_bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER tours_updated BEFORE UPDATE ON public.tour_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SHOPPING ORDERS ============
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_code text NOT NULL UNIQUE DEFAULT ('SHP-' || upper(substr(md5(random()::text),1,8))),
  item_name text NOT NULL,
  brand text,
  quantity integer NOT NULL DEFAULT 1,
  budget numeric(14,2),
  notes text,
  status text NOT NULL DEFAULT 'pending',
  tracking_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop owner read" ON public.shop_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "shop owner insert" ON public.shop_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "shop staff update" ON public.shop_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER shop_updated BEFORE UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PAYMENT METHODS ============
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  brand text NOT NULL DEFAULT 'card',
  last4 text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm owner all" ON public.payment_methods FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ DIGITAL DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'receipt',
  file_url text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO service_role;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs owner read" ON public.user_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "docs owner insert" ON public.user_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "docs owner delete" ON public.user_documents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ REALTIME ============
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.trip_events REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ LOYALTY MAINTENANCE ============
CREATE OR REPLACE FUNCTION public.apply_loyalty_on_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pts integer; _total integer; _tier text;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    _pts := greatest(1, floor(coalesce(NEW.total_price,0) / 1000)::int);
    UPDATE public.profiles SET loyalty_points = loyalty_points + _pts WHERE id = NEW.user_id
      RETURNING loyalty_points INTO _total;
    _tier := CASE WHEN _total >= 5000 THEN 'elite' WHEN _total >= 2000 THEN 'diamond'
                  WHEN _total >= 500 THEN 'gold' ELSE 'silver' END;
    UPDATE public.profiles SET loyalty_tier = _tier WHERE id = NEW.user_id;
    INSERT INTO public.notifications(user_id, title, body, kind)
      VALUES (NEW.user_id, 'Payment confirmed', 'Your booking payment was confirmed. You earned ' || _pts || ' reward points.', 'payment');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS bookings_loyalty ON public.bookings;
CREATE TRIGGER bookings_loyalty AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.apply_loyalty_on_paid();

-- ============ WALLET AUTO-PROVISION ============
CREATE OR REPLACE FUNCTION public.ensure_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets(user_id, balance) VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profiles_ensure_wallet ON public.profiles;
CREATE TRIGGER profiles_ensure_wallet AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_wallet();
INSERT INTO public.wallets(user_id, balance)
  SELECT id, 0 FROM public.profiles ON CONFLICT (user_id) DO NOTHING;