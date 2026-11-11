CREATE TABLE IF NOT EXISTS public.employee_password_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_password_setup_tokens_user_id_idx
  ON public.employee_password_setup_tokens (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS employee_password_setup_tokens_one_unused_per_user_idx
  ON public.employee_password_setup_tokens (user_id)
  WHERE used_at IS NULL;

ALTER TABLE public.employee_password_setup_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employee_password_setup_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.employee_password_setup_tokens TO service_role;

CREATE OR REPLACE FUNCTION public.consume_employee_password_setup_token(
  p_token_hash text,
  p_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  UPDATE public.employee_password_setup_tokens
  SET used_at = pg_catalog.now()
  WHERE token_hash = p_token_hash
    AND used_at IS NULL
    AND expires_at > pg_catalog.now()
  RETURNING user_id INTO target_user_id;

  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.users
  SET password_hash = p_password_hash,
      updated_at = pg_catalog.now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee account was not found';
  END IF;

  UPDATE public.refresh_sessions
  SET revoked_at = pg_catalog.now()
  WHERE user_id = target_user_id
    AND revoked_at IS NULL;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_employee_password_setup_token(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_employee_password_setup_token(text, text)
  TO service_role;
