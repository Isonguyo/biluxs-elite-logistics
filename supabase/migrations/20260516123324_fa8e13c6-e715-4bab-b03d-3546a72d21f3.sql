
-- DRIVERS
CREATE TYPE driver_status AS ENUM ('active','off_duty','suspended');

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  license_no text,
  photo_url text,
  rating numeric NOT NULL DEFAULT 5.0,
  status driver_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers public read" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Admins manage drivers" ON public.drivers FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attach driver to bookings
ALTER TABLE public.bookings ADD COLUMN driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

CREATE POLICY "Admins assign drivers to bookings" ON public.bookings FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROCUREMENT REQUESTS
CREATE TYPE procurement_status AS ENUM ('submitted','sourcing','shipped','delivered','cancelled');

CREATE TABLE public.procurement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_description text NOT NULL,
  brand text,
  source_city text,
  estimated_value numeric DEFAULT 0,
  size text,
  notes text,
  reference_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  status procurement_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create procurement" ON public.procurement_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own procurement" ON public.procurement_requests FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view procurement" ON public.procurement_requests FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update procurement" ON public.procurement_requests FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER procurement_updated_at BEFORE UPDATE ON public.procurement_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.procurement_requests;

-- Storage bucket for reference images
INSERT INTO storage.buckets (id, name, public) VALUES ('procurement-refs','procurement-refs', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Procurement refs public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'procurement-refs');
CREATE POLICY "Users upload own procurement refs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'procurement-refs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own procurement refs" ON storage.objects FOR UPDATE
  USING (bucket_id = 'procurement-refs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own procurement refs" ON storage.objects FOR DELETE
  USING (bucket_id = 'procurement-refs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed a few drivers
INSERT INTO public.drivers (full_name, phone, license_no, rating, status) VALUES
('Emmanuel Etim','+2348012345001','CR-DRV-001',4.9,'active'),
('Joseph Bassey','+2348012345002','CR-DRV-002',4.8,'active'),
('Patrick Okon','+2348012345003','CR-DRV-003',5.0,'active'),
('Daniel Effiong','+2348012345004','CR-DRV-004',4.7,'active');
