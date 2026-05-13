
-- Roles enum and tables
CREATE TYPE public.app_role AS ENUM ('admin', 'corporate_admin', 'user');
CREATE TYPE public.vehicle_category AS ENUM ('sedan', 'suv', 'bus', 'coach');
CREATE TYPE public.vehicle_status AS ENUM ('available', 'in_use', 'maintenance');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  corporate_account_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- corporate_accounts
CREATE TABLE public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

-- vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category vehicle_category NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  base_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_km_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  status vehicle_status NOT NULL DEFAULT 'available',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waybill_code TEXT NOT NULL UNIQUE DEFAULT ('BLX-' || upper(substr(md5(random()::text), 1, 8))),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  luxury_protocol BOOLEAN NOT NULL DEFAULT false,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- tracking_logs
CREATE TABLE public.tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles viewable by self" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vehicles public read" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Admins manage vehicles" ON public.vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tracking visible to booking owner" ON public.tracking_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
);
CREATE POLICY "Admins manage tracking" ON public.tracking_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corporate accounts public submit" ON public.corporate_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view corporate" ON public.corporate_accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update corporate" ON public.corporate_accounts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed fleet
INSERT INTO public.vehicles (name, category, description, capacity, base_rate, per_km_rate, status, features) VALUES
('Lexus LX 570 Executive', 'suv', 'Flagship full-size luxury SUV with chauffeur, leather interior, and premium sound.', 6, 150000, 1200, 'available', '["Chauffeur", "Leather", "Wi-Fi", "Refreshments"]'::jsonb),
('Mercedes-Benz S-Class', 'sedan', 'The benchmark of executive sedans. Whisper-quiet cabin, ambient lighting.', 3, 120000, 950, 'available', '["Chauffeur", "Massage Seats", "Wi-Fi"]'::jsonb),
('Toyota Coaster Premium', 'coach', 'Executive 30-seater coach for inter-state travel and corporate shuttles.', 30, 350000, 800, 'available', '["AC", "Recliners", "Onboard Steward"]'::jsonb),
('Toyota Land Cruiser Prado', 'suv', 'Reliable luxury SUV for protocol and tourism services.', 5, 110000, 900, 'available', '["Chauffeur", "Leather"]'::jsonb),
('Mercedes-Benz E-Class', 'sedan', 'Refined executive sedan for business meetings and airport transfers.', 3, 95000, 800, 'in_use', '["Chauffeur", "Wi-Fi"]'::jsonb),
('Mercedes Sprinter VIP', 'bus', '14-seater VIP shuttle with captain seats and partition.', 14, 220000, 850, 'available', '["VIP Seats", "AC", "Wi-Fi"]'::jsonb);
