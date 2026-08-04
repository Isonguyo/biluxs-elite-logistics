
-- ============ ORGANIZATIONS ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'branch',
  country text,
  city text,
  region text,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email text,
  contact_phone text,
  address text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org read staff" ON public.organizations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "org write super" ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PLATFORM ROLES ============
CREATE TABLE public.platform_roles (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_roles TO authenticated;
GRANT ALL ON public.platform_roles TO service_role;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles read auth" ON public.platform_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles write super" ON public.platform_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));

CREATE TABLE public.permissions (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perm read auth" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "perm write super" ON public.permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL REFERENCES public.platform_roles(key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_key, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp read auth" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "rp write super" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));

CREATE TABLE public.user_platform_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_key text NOT NULL REFERENCES public.platform_roles(key) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_platform_roles TO authenticated;
GRANT ALL ON public.user_platform_roles TO service_role;
ALTER TABLE public.user_platform_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upr read self or super" ON public.user_platform_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "upr write super" ON public.user_platform_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'super_user') OR EXISTS (
    SELECT 1 FROM public.user_platform_roles upr
    JOIN public.role_permissions rp ON rp.role_key = upr.role_key
    WHERE upr.user_id = _user_id AND rp.permission_key = _permission
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;

-- ============ FEATURE FLAGS ============
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'product',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ff public read" ON public.feature_flags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ff write super" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER feature_flags_updated BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PRICING ENGINE ============
CREATE TABLE public.pricing_rules (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'transport',
  value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'ngn',
  description text,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr public read" ON public.pricing_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pr write super" ON public.pricing_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER pricing_rules_updated BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INTEGRATIONS ============
CREATE TABLE public.integrations (
  key text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'not_configured',
  docs_url text,
  notes text,
  last_checked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "int read super" ON public.integrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_user'));
CREATE POLICY "int write super" ON public.integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER integrations_updated BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PARTNERS ============
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'corporate',
  contact_name text,
  contact_email text,
  contact_phone text,
  contract_status text NOT NULL DEFAULT 'prospect',
  contract_start date,
  contract_end date,
  performance_score numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners read staff" ON public.partners FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "partners write super" ON public.partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER partners_updated BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTOMATION RULES ============
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_field text NOT NULL,
  trigger_operator text NOT NULL DEFAULT 'gt',
  trigger_value text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  fire_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto read staff" ON public.automation_rules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "auto write super" ON public.automation_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER automation_rules_updated BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CMS ============
CREATE TABLE public.cms_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  title text,
  body text,
  image_url text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section, key)
);
GRANT SELECT ON public.cms_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cms_blocks TO authenticated;
GRANT ALL ON public.cms_blocks TO service_role;
ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms public read" ON public.cms_blocks FOR SELECT TO anon, authenticated USING (published OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "cms write super" ON public.cms_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER cms_blocks_updated BEFORE UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  city text NOT NULL,
  package_name text,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  summary text,
  featured boolean NOT NULL DEFAULT false,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.destinations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.destinations TO authenticated;
GRANT ALL ON public.destinations TO service_role;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dest public read" ON public.destinations FOR SELECT TO anon, authenticated USING (available OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "dest write super" ON public.destinations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));
CREATE TRIGGER destinations_updated BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SECURITY EVENTS ============
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  ip_address text,
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec read super" ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_user'));
CREATE POLICY "sec insert auth" ON public.security_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sec update super" ON public.security_events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));

-- ============ BROADCASTS ============
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'in_app',
  audience text NOT NULL DEFAULT 'all',
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  recipients integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bc read staff" ON public.broadcasts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_user'));
CREATE POLICY "bc write super" ON public.broadcasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_user')) WITH CHECK (public.has_role(auth.uid(),'super_user'));

-- ============ STAFF FIELDS + AUDIT ENRICHMENT ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_logins integer NOT NULL DEFAULT 0;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS before_value jsonb,
  ADD COLUMN IF NOT EXISTS after_value jsonb;

-- ============ SEED ============
INSERT INTO public.platform_roles (key,label,description,is_system,sort_order) VALUES
 ('super_admin','Super Admin','Full platform governance',true,1),
 ('operations_director','Operations Director','Oversees all operations',false,2),
 ('dispatch_manager','Dispatch Manager','Assigns and monitors trips',false,3),
 ('fleet_manager','Fleet Manager','Vehicles, maintenance, inspections',false,4),
 ('finance_manager','Finance Manager','Payments, refunds, payouts',false,5),
 ('travel_consultant','Travel Consultant','Tours, flights, hotels',false,6),
 ('support_agent','Support Agent','Customer support desk',false,7),
 ('marketing','Marketing','Campaigns and content',false,8),
 ('hr','HR','Staff and driver onboarding',false,9),
 ('auditor','Auditor','Read-only compliance access',false,10),
 ('developer','Developer','Technical and integration access',false,11),
 ('analyst','Read-only Analyst','Analytics only',false,12);

INSERT INTO public.permissions (key,label,category,description) VALUES
 ('can_refund','Can Refund','finance','Issue refunds on payments'),
 ('can_edit_pricing','Can Edit Pricing','finance','Change pricing engine values'),
 ('can_view_financials','Can View Financials','finance','Access revenue and payout data'),
 ('can_assign_drivers','Can Assign Drivers','operations','Dispatch drivers to bookings'),
 ('can_manage_vehicles','Can Manage Vehicles','fleet','Add, edit and retire vehicles'),
 ('can_suspend_drivers','Can Suspend Drivers','fleet','Suspend or reinstate drivers'),
 ('can_export_reports','Can Export Reports','intelligence','Download CSV/PDF reports'),
 ('can_delete_records','Can Delete Records','platform','Permanently remove records'),
 ('can_manage_users','Can Manage Users','platform','Create and suspend staff accounts'),
 ('can_manage_features','Can Manage Features','platform','Toggle feature flags'),
 ('can_manage_content','Can Manage Content','content','Edit site content and destinations'),
 ('can_broadcast','Can Broadcast','communication','Send platform-wide messages'),
 ('can_view_audit','Can View Audit','security','Read audit and security trails');

INSERT INTO public.role_permissions (role_key,permission_key) VALUES
 ('operations_director','can_assign_drivers'),('operations_director','can_view_financials'),
 ('operations_director','can_export_reports'),('operations_director','can_manage_vehicles'),
 ('dispatch_manager','can_assign_drivers'),
 ('fleet_manager','can_manage_vehicles'),('fleet_manager','can_suspend_drivers'),
 ('finance_manager','can_refund'),('finance_manager','can_edit_pricing'),('finance_manager','can_view_financials'),
 ('travel_consultant','can_manage_content'),
 ('support_agent','can_broadcast'),
 ('marketing','can_manage_content'),('marketing','can_broadcast'),
 ('auditor','can_view_audit'),('auditor','can_export_reports'),
 ('developer','can_manage_features'),
 ('analyst','can_export_reports');

INSERT INTO public.feature_flags (key,label,description,category,enabled) VALUES
 ('luxury_shopping','Luxury Shopping','Personal shopping & procurement module','product',true),
 ('cargo','Cargo','Freight and cargo shipments','product',true),
 ('flights','Flights','Flight booking requests','product',true),
 ('hotels','Hotels','Hotel reservation requests','product',true),
 ('tours','Tour Packages','Tourism packages','product',true),
 ('wallet','Wallet','Customer wallet and top-ups','finance',true),
 ('rewards','Rewards','Loyalty points and tiers','finance',true),
 ('ai_assistant','AI Assistant','Executive AI copilot','platform',true),
 ('sos','SOS','Driver emergency button','safety',true),
 ('qr_verification','QR Verification','Passenger QR handshake','safety',true);

INSERT INTO public.pricing_rules (key,label,category,value,unit,description) VALUES
 ('airport_base','Airport Transfer Base','transport',35000,'ngn','Flat base for airport runs'),
 ('per_km','Distance Rate','transport',850,'ngn','Charge per kilometre'),
 ('luxury_protocol','Luxury Protocol','transport',20,'percent','Uplift applied to luxury protocol bookings'),
 ('cargo_per_kg','Cargo Rate','cargo',1200,'ngn','Charge per kilogram'),
 ('peak_hours','Peak Hour Surcharge','transport',15,'percent','07:00–10:00 and 16:00–20:00'),
 ('holiday','Holiday Surcharge','transport',25,'percent','Public holiday uplift'),
 ('night_charge','Night Charge','transport',10,'percent','22:00–05:00 uplift'),
 ('driver_bonus','Driver Completion Bonus','payouts',2500,'ngn','Per completed luxury trip'),
 ('service_fee','Service Fee','finance',5,'percent','Platform service fee'),
 ('tax_vat','VAT','finance',7.5,'percent','Value added tax');

INSERT INTO public.integrations (key,name,category,status,notes) VALUES
 ('paystack','Paystack','payments','not_configured','Primary card & transfer gateway'),
 ('flutterwave','Flutterwave','payments','not_configured','Secondary gateway'),
 ('google_maps','Google Maps','maps','not_configured','Geocoding and routing'),
 ('whatsapp','WhatsApp Business','messaging','not_configured','Chauffeur & concierge chat'),
 ('twilio','Twilio SMS','messaging','not_configured','OTP and trip alerts'),
 ('firebase','Firebase Push','messaging','not_configured','Mobile push notifications'),
 ('email','Transactional Email','messaging','not_configured','Receipts and itineraries'),
 ('ai_gateway','AI Gateway','ai','connected','Executive copilot and insights');
