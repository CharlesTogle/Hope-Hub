WITH downgraded AS (
  UPDATE public.profile AS p
  SET user_type = 'student'
  FROM auth.users AS u
  WHERE p.uuid = u.id
    AND p.user_type = 'admin'
    AND COALESCE(u.raw_app_meta_data ->> 'userType', '') <> 'admin'
  RETURNING p.uuid
)
INSERT INTO public.student_class_code (uuid, class_code)
SELECT d.uuid, NULL
FROM downgraded AS d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.student_class_code AS scc
  WHERE scc.uuid = d.uuid
);
