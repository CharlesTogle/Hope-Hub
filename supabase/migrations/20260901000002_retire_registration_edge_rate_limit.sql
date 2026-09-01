-- Registration now uses GoTrue's server-side sign-in/sign-up limit.
DELETE FROM public.auth_rate_limit_config WHERE endpoint = 'registration';
DELETE FROM public.auth_rate_limit_requests WHERE endpoint = 'registration';
