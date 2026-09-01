REVOKE UPDATE ON TABLE public.profile FROM authenticated;
GRANT UPDATE (full_name, email) ON TABLE public.profile TO authenticated;
