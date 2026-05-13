
-- Fix search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke public execute on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten corporate insert: require non-empty values
DROP POLICY "Corporate accounts public submit" ON public.corporate_accounts;
CREATE POLICY "Corporate accounts public submit" ON public.corporate_accounts
  FOR INSERT WITH CHECK (
    length(company_name) > 1 AND length(contact_email) > 3 AND approved = false
  );
