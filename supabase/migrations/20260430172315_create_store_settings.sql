CREATE TABLE public.store_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.store_settings
  FOR ALL TO public
  USING (is_admin())
  WITH CHECK (is_admin());;
