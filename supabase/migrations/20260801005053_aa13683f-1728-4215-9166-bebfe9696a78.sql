REVOKE ALL ON FUNCTION public.wallet_topup(numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_topup(numeric, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.apply_loyalty_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_wallet() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;