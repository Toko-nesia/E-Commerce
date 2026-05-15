
-- Grant privileges ke role yang dibutuhkan untuk tabel store_settings
-- service_role: dipakai oleh service client (bypass RLS) → butuh SELECT, INSERT, UPDATE, DELETE
-- authenticated: dipakai oleh server client (dengan RLS) → butuh SELECT, UPDATE (via RLS policy)
-- anon: butuh SELECT untuk membaca data publik (jika diperlukan)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO service_role;
GRANT SELECT, UPDATE ON public.store_settings TO authenticated;
GRANT SELECT ON public.store_settings TO anon;
;
