ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.tracking_logs REPLICA IDENTITY FULL;
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;

-- Seed a few demo vehicles if empty
INSERT INTO public.vehicles (name, category, capacity, base_rate, per_km_rate, description, features, status)
SELECT * FROM (VALUES
  ('Mercedes-Benz S-Class', 'sedan'::vehicle_category, 4, 85000, 1200, 'Flagship executive sedan with chauffeur protocol.', '["WiFi","Refreshments","Leather"]'::jsonb, 'available'::vehicle_status),
  ('Range Rover Autobiography', 'suv'::vehicle_category, 5, 110000, 1500, 'Premium SUV for VIP city movement.', '["WiFi","Bodyguard option","Tinted"]'::jsonb, 'available'::vehicle_status),
  ('Toyota Hiace Executive', 'bus'::vehicle_category, 12, 140000, 900, 'Executive shuttle for corporate teams.', '["AC","Recliners"]'::jsonb, 'available'::vehicle_status),
  ('MAN Lion''s Coach', 'coach'::vehicle_category, 45, 320000, 700, 'Inter-state luxury coach with hostess service.', '["WiFi","Restroom","Hostess"]'::jsonb, 'available'::vehicle_status),
  ('BMW 7 Series', 'sedan'::vehicle_category, 4, 90000, 1300, 'Discreet executive sedan for boardroom transfers.', '["WiFi","Leather"]'::jsonb, 'available'::vehicle_status),
  ('Lexus LX 600', 'suv'::vehicle_category, 6, 120000, 1450, 'Off-road capable luxury SUV.', '["WiFi","Tinted"]'::jsonb, 'available'::vehicle_status)
) AS v(name, category, capacity, base_rate, per_km_rate, description, features, status)
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles);