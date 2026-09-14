-- Make class membership and PFT access class-scoped.

ALTER TABLE public.teacher_class_code
  ADD COLUMN IF NOT EXISTS retired_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.teacher_class_code'::regclass
      AND conname = 'teacher_class_code_class_code_key'
  ) THEN
    ALTER TABLE public.teacher_class_code
      ADD CONSTRAINT teacher_class_code_class_code_key UNIQUE (class_code);
  END IF;
END;
$$;

DELETE FROM public.student_class_code AS duplicate
USING (
  SELECT id,
    row_number() OVER (PARTITION BY uuid ORDER BY id) AS duplicate_number
  FROM public.student_class_code
) AS ranked
WHERE duplicate.id = ranked.id
  AND ranked.duplicate_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS student_class_code_uuid_key
  ON public.student_class_code (uuid);

CREATE TABLE IF NOT EXISTS public.class_physical_fitness_test (
  uuid uuid NOT NULL REFERENCES public.profile(uuid) ON DELETE CASCADE,
  class_code text NOT NULL REFERENCES public.teacher_class_code(class_code),
  pre_physical_fitness_test jsonb,
  post_physical_fitness_test jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_physical_fitness_test_pkey PRIMARY KEY (uuid, class_code)
);

CREATE INDEX IF NOT EXISTS class_physical_fitness_test_class_code_idx
  ON public.class_physical_fitness_test (class_code);

INSERT INTO public.class_physical_fitness_test (
  uuid,
  class_code,
  pre_physical_fitness_test,
  post_physical_fitness_test
)
SELECT
  pft.uuid,
  scc.class_code,
  pft.pre_physical_fitness_test,
  pft.post_physical_fitness_test::jsonb
FROM public.physical_fitness_test AS pft
JOIN public.student_class_code AS scc ON scc.uuid = pft.uuid
JOIN public.teacher_class_code AS tcc ON tcc.class_code = scc.class_code
WHERE scc.class_code IS NOT NULL
  AND tcc.retired_at IS NULL
ON CONFLICT (uuid, class_code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.current_user_has_active_class(p_class_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_class_code AS scc
    JOIN public.teacher_class_code AS tcc ON tcc.class_code = scc.class_code
    WHERE scc.uuid = auth.uid()
      AND scc.class_code = p_class_code
      AND tcc.retired_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_teaches_student_in_class(
  p_student_uuid uuid,
  p_class_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile AS teacher
    JOIN public.teacher_class_code AS tcc ON tcc.uuid = teacher.uuid
    JOIN public.student_class_code AS scc ON scc.class_code = tcc.class_code
    WHERE teacher.uuid = auth.uid()
      AND teacher.user_type = 'teacher'
      AND scc.uuid = p_student_uuid
      AND scc.class_code = p_class_code
      AND tcc.retired_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_teaches_student(p_student_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_class_code AS scc
    WHERE scc.uuid = p_student_uuid
      AND public.current_user_teaches_student_in_class(p_student_uuid, scc.class_code)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_view_student(p_student_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.uid() = p_student_uuid
    OR public.current_user_teaches_student(p_student_uuid)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_active_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile AS p
    JOIN public.student_class_code AS scc ON scc.uuid = p.uuid
    JOIN public.teacher_class_code AS tcc ON tcc.class_code = scc.class_code
    WHERE p.uuid = auth.uid()
      AND p.user_type = 'student'
      AND tcc.retired_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.class_code_exists(p_class_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_class_code
    WHERE class_code = p_class_code AND retired_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.class_code_is_available(p_class_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.teacher_class_code
    WHERE class_code = p_class_code
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_has_active_class(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_teaches_student_in_class(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_active_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.class_code_is_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_active_class(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_teaches_student_in_class(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_active_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.class_code_is_available(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_class(p_class_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profile
    WHERE uuid = auth.uid() AND user_type = 'student'
  ) THEN
    RAISE EXCEPTION 'Only students can join a class';
  END IF;

  PERFORM 1
  FROM public.teacher_class_code
  WHERE class_code = p_class_code AND retired_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class code is invalid or retired'; END IF;

  INSERT INTO public.student_class_code (uuid, class_code)
  VALUES (auth.uid(), p_class_code)
  ON CONFLICT (uuid) DO UPDATE SET class_code = EXCLUDED.class_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_class()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  UPDATE public.student_class_code SET class_code = NULL WHERE uuid = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.retire_class(p_class_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;

  PERFORM 1
  FROM public.teacher_class_code
  WHERE class_code = p_class_code
    AND uuid = auth.uid()
    AND retired_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class code is not owned by the current teacher'; END IF;

  UPDATE public.student_class_code SET class_code = NULL WHERE class_code = p_class_code;
  UPDATE public.teacher_class_code SET retired_at = now() WHERE class_code = p_class_code;
END;
$$;

REVOKE ALL ON FUNCTION public.join_class(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_class() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.retire_class(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_class(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_class() TO authenticated;
GRANT EXECUTE ON FUNCTION public.retire_class(text) TO authenticated;

DROP POLICY IF EXISTS "Users can delete their own student class membership" ON public.student_class_code;
DROP POLICY IF EXISTS "Users can insert their own student class membership" ON public.student_class_code;
DROP POLICY IF EXISTS "Users can update their own student class membership" ON public.student_class_code;
DROP POLICY IF EXISTS "Users can view their own student class membership or students they teach" ON public.student_class_code;
CREATE POLICY "Students can view their own membership or teachers can view current students"
ON public.student_class_code
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = uuid AND EXISTS (
      SELECT 1 FROM public.profile
      WHERE profile.uuid = auth.uid() AND profile.user_type = 'student'
    ))
    OR public.current_user_teaches_student(uuid)
  );

DROP POLICY IF EXISTS "Teachers can delete their own class codes" ON public.teacher_class_code;
DROP POLICY IF EXISTS "Teachers can update their own class codes" ON public.teacher_class_code;
DROP POLICY IF EXISTS "Teachers can view their own class codes" ON public.teacher_class_code;
DROP POLICY IF EXISTS "Teachers can insert their own class codes" ON public.teacher_class_code;
CREATE POLICY "Teachers can view their own class codes" ON public.teacher_class_code
  FOR SELECT TO authenticated USING (public.current_user_is_teacher() AND auth.uid() = uuid);
CREATE POLICY "Teachers can insert active class codes" ON public.teacher_class_code
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_teacher() AND auth.uid() = uuid AND retired_at IS NULL);

DROP POLICY IF EXISTS "Users can view their own lecture progress or students they teach" ON public.lecture_progress;
DROP POLICY IF EXISTS "Users can insert their own lecture progress" ON public.lecture_progress;
DROP POLICY IF EXISTS "Users can update their own lecture progress" ON public.lecture_progress;
CREATE POLICY "Active students and teachers can view lecture progress"
ON public.lecture_progress FOR SELECT TO authenticated
USING (
  (auth.uid() = uuid AND public.current_user_is_active_student())
  OR public.current_user_teaches_student(uuid)
);
CREATE POLICY "Active students can insert lecture progress"
ON public.lecture_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = uuid AND public.current_user_is_active_student());
CREATE POLICY "Active students can update lecture progress"
ON public.lecture_progress FOR UPDATE TO authenticated
USING (auth.uid() = uuid AND public.current_user_is_active_student())
WITH CHECK (auth.uid() = uuid AND public.current_user_is_active_student());

DROP POLICY IF EXISTS "Authenticated users can view quizzes" ON public.quiz;
CREATE POLICY "Active students and teachers can view quizzes"
ON public.quiz FOR SELECT TO authenticated
USING (public.current_user_is_teacher() OR public.current_user_is_active_student());

DROP POLICY IF EXISTS "Students can insert their own quiz progress" ON public.quiz_progress;
DROP POLICY IF EXISTS "Users can view their own quiz progress or students they teach" ON public.quiz_progress;
DROP POLICY IF EXISTS "Students can update their own quiz progress" ON public.quiz_progress;
CREATE POLICY "Active students and teachers can view quiz progress"
ON public.quiz_progress FOR SELECT TO authenticated
USING (
  (auth.uid() = user_id AND public.current_user_is_active_student())
  OR public.current_user_teaches_student(user_id)
);
CREATE POLICY "Active students can insert quiz progress"
ON public.quiz_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.current_user_is_active_student());
CREATE POLICY "Active students can update quiz progress"
ON public.quiz_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.current_user_is_active_student())
WITH CHECK (auth.uid() = user_id AND public.current_user_is_active_student());

ALTER TABLE public.class_physical_fitness_test ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their current class PFT" ON public.class_physical_fitness_test;
DROP POLICY IF EXISTS "Students can insert their current class PFT" ON public.class_physical_fitness_test;
DROP POLICY IF EXISTS "Students can update their current class PFT" ON public.class_physical_fitness_test;
CREATE POLICY "Students can view their current class PFT" ON public.class_physical_fitness_test
  FOR SELECT TO authenticated USING (
    (auth.uid() = uuid AND public.current_user_has_active_class(class_code))
    OR public.current_user_teaches_student_in_class(uuid, class_code)
  );
CREATE POLICY "Students can insert their current class PFT" ON public.class_physical_fitness_test
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = uuid AND public.current_user_has_active_class(class_code)
  );
CREATE POLICY "Students can update their current class PFT" ON public.class_physical_fitness_test
  FOR UPDATE TO authenticated
  USING (auth.uid() = uuid AND public.current_user_has_active_class(class_code))
  WITH CHECK (auth.uid() = uuid AND public.current_user_has_active_class(class_code));

DROP POLICY IF EXISTS "Users can insert their own PFT data" ON public.physical_fitness_test;
DROP POLICY IF EXISTS "Users can view their own PFT data or students they teach" ON public.physical_fitness_test;
DROP POLICY IF EXISTS "Users can update their own PFT data" ON public.physical_fitness_test;

DROP FUNCTION IF EXISTS public.get_pft_summary_for_viewer(uuid, text);
CREATE OR REPLACE FUNCTION public.get_pft_summary_for_viewer(
  p_student_uuid uuid,
  p_class_code text,
  p_test_type text
) RETURNS TABLE(full_name text, email text, pft_data jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_test_type NOT IN ('pre-test', 'post-test') THEN RAISE EXCEPTION 'Invalid test type'; END IF;
  IF NOT (
    (auth.uid() = p_student_uuid AND public.current_user_has_active_class(p_class_code))
    OR public.current_user_teaches_student_in_class(p_student_uuid, p_class_code)
  ) THEN RAISE EXCEPTION 'Access denied'; END IF;

  RETURN QUERY
  SELECT p.full_name, p.email,
    CASE WHEN p_test_type = 'pre-test' THEN cpft.pre_physical_fitness_test
         ELSE cpft.post_physical_fitness_test END
  FROM public.profile AS p
  JOIN public.class_physical_fitness_test AS cpft
    ON cpft.uuid = p.uuid AND cpft.class_code = p_class_code
  WHERE p.uuid = p_student_uuid;
END;
$$;
REVOKE ALL ON FUNCTION public.get_pft_summary_for_viewer(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pft_summary_for_viewer(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.retrieve_students_by_class(class_code_input text)
RETURNS TABLE(
  full_name text, email text, uuid uuid, lecture_progress jsonb,
  pre_physical_fitness_test json, post_physical_fitness_test json, quiz_data jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teacher_class_code
    WHERE uuid = auth.uid() AND class_code = class_code_input AND retired_at IS NULL
  ) THEN RAISE EXCEPTION 'Access denied: class code is not an active class owned by current user'; END IF;

  RETURN QUERY
  WITH class_students AS (
    SELECT p.full_name, p.email, p.uuid
    FROM public.profile p JOIN public.student_class_code scc ON scc.uuid = p.uuid
    WHERE scc.class_code = class_code_input
  ),
  lecture_agg AS (
    SELECT lp.uuid, jsonb_agg(lp.lecture_progress) lecture_progress
    FROM public.lecture_progress lp WHERE lp.uuid IN (SELECT uuid FROM class_students) GROUP BY lp.uuid
  ),
  pft_agg AS (
    SELECT cpft.uuid, json_agg(cpft.pre_physical_fitness_test) pre_physical_fitness_test,
      json_agg(cpft.post_physical_fitness_test) post_physical_fitness_test
    FROM public.class_physical_fitness_test cpft
    WHERE cpft.class_code = class_code_input AND cpft.uuid IN (SELECT uuid FROM class_students)
    GROUP BY cpft.uuid
  ),
  quiz_agg AS (
    SELECT qr.user_id, jsonb_agg(jsonb_build_object('quiz_number', qr.quiz_id, 'score', qr.score,
      'status', qr.status, 'total_items', qr.total_items)) quiz_data
    FROM public.quiz_progress qr WHERE qr.user_id IN (SELECT uuid FROM class_students) GROUP BY qr.user_id
  )
  SELECT cs.full_name, cs.email, cs.uuid, COALESCE(la.lecture_progress, '[]'::jsonb),
    COALESCE(pa.pre_physical_fitness_test, '[]'::json), COALESCE(pa.post_physical_fitness_test, '[]'::json),
    COALESCE(qa.quiz_data, '[]'::jsonb)
  FROM class_students cs LEFT JOIN lecture_agg la ON la.uuid = cs.uuid
  LEFT JOIN pft_agg pa ON pa.uuid = cs.uuid LEFT JOIN quiz_agg qa ON qa.user_id = cs.uuid;
END;
$$;
