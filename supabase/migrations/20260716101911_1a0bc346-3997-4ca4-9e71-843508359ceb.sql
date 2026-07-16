
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.scan_booking_qr(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.scan_booking_qr(uuid) TO authenticated;

DROP POLICY IF EXISTS "Drivers public read" ON public.drivers;

ALTER TABLE public.corporate_accounts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Corporate accounts public submit" ON public.corporate_accounts;

CREATE POLICY "Authenticated users submit corporate accounts"
  ON public.corporate_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND approved = false
    AND length(company_name) BETWEEN 2 AND 200
    AND length(contact_email) BETWEEN 3 AND 255
    AND (contact_phone IS NULL OR length(contact_phone) <= 40)
    AND (address IS NULL OR length(address) <= 500)
  );

CREATE POLICY "Users view own corporate submissions"
  ON public.corporate_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
