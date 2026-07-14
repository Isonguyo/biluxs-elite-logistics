
-- Add new roles: super_user, driver, customer (keep existing for compatibility)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
