-- Repair auth users created before profile provisioning was guaranteed.
-- The insert is idempotent so it is safe to run against existing projects.
INSERT INTO public.profile (uuid, full_name, email, user_type)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'fullName', ''), u.email),
  u.email,
  CASE
    WHEN u.raw_user_meta_data ->> 'userType' IN ('admin', 'teacher')
      THEN (u.raw_user_meta_data ->> 'userType')::public.user_type
    ELSE 'student'::public.user_type
  END
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profile AS p
  WHERE p.uuid = u.id
)
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO public.lecture_progress (uuid, lecture_progress)
SELECT u.id, '[]'::jsonb
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.lecture_progress AS lp
  WHERE lp.uuid = u.id
);

INSERT INTO public.physical_fitness_test (uuid)
SELECT u.id
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.physical_fitness_test AS pft
  WHERE pft.uuid = u.id
);
