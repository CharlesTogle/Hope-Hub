-- A profile is owned by, and must not outlive, its Supabase Auth user.
CREATE TABLE public.orphaned_profile_archive (
  uuid uuid PRIMARY KEY,
  profile jsonb NOT NULL,
  lecture_progress jsonb,
  physical_fitness_test jsonb,
  student_class_codes jsonb,
  teacher_class_codes jsonb,
  quiz_progress jsonb,
  archived_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orphaned_profile_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.orphaned_profile_archive FROM PUBLIC, anon, authenticated;

INSERT INTO public.orphaned_profile_archive (
  uuid,
  profile,
  lecture_progress,
  physical_fitness_test,
  student_class_codes,
  teacher_class_codes,
  quiz_progress
)
SELECT
  p.uuid,
  to_jsonb(p),
  (SELECT to_jsonb(lp) FROM public.lecture_progress AS lp WHERE lp.uuid = p.uuid),
  (SELECT to_jsonb(pft) FROM public.physical_fitness_test AS pft WHERE pft.uuid = p.uuid),
  (SELECT jsonb_agg(to_jsonb(scc)) FROM public.student_class_code AS scc WHERE scc.uuid = p.uuid),
  (SELECT jsonb_agg(to_jsonb(tcc)) FROM public.teacher_class_code AS tcc WHERE tcc.uuid = p.uuid),
  (SELECT jsonb_agg(to_jsonb(qp)) FROM public.quiz_progress AS qp WHERE qp.user_id = p.uuid)
FROM public.profile AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users AS u
  WHERE u.id = p.uuid
);

DELETE FROM public.profile AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users AS u
  WHERE u.id = p.uuid
);

ALTER TABLE public.profile
  ADD CONSTRAINT profile_auth_user_fkey
  FOREIGN KEY (uuid)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;
