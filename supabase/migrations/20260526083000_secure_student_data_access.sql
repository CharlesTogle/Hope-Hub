-- Tighten student-data access and class ownership policies.
-- This migration replaces open read/write policies with:
-- - self access for the owning user
-- - teacher read access only for students in the teacher's current class
-- - teacher-only ownership of teacher_class_code rows
-- It also adds a narrow class-code existence RPC so students can still
-- validate join codes without reading the teacher_class_code table.

CREATE OR REPLACE FUNCTION public.current_user_is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile
    WHERE uuid = auth.uid()
      AND user_type = 'teacher'
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
    FROM public.teacher_class_code AS tcc
    INNER JOIN public.student_class_code AS scc
      ON scc.class_code = tcc.class_code
    WHERE tcc.uuid = auth.uid()
      AND scc.uuid = p_student_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_view_student(p_student_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = p_student_uuid
    OR public.current_user_teaches_student(p_student_uuid);
$$;

CREATE OR REPLACE FUNCTION public.class_code_exists(p_class_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_class_code
    WHERE class_code = p_class_code
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_teacher() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_teaches_student(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_can_view_student(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.class_code_exists(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_teaches_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_view_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.class_code_exists(text) TO authenticated;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profile;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profile;

DROP POLICY IF EXISTS "Users can view their own profile or students they teach" ON public.profile;

CREATE POLICY "Users can view their own profile or students they teach"
ON public.profile
FOR SELECT
TO authenticated
USING (public.current_user_can_view_student(uuid));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profile;

CREATE POLICY "Users can update their own profile"
ON public.profile
FOR UPDATE
TO authenticated
USING (auth.uid() = uuid)
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.lecture_progress;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.lecture_progress;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.lecture_progress;
DROP POLICY IF EXISTS "Users can insert their own lecture progress" ON public.lecture_progress;

CREATE POLICY "Users can insert their own lecture progress"
ON public.lecture_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Users can view their own lecture progress or students they teach" ON public.lecture_progress;

CREATE POLICY "Users can view their own lecture progress or students they teach"
ON public.lecture_progress
FOR SELECT
TO authenticated
USING (public.current_user_can_view_student(uuid));

DROP POLICY IF EXISTS "Users can update their own lecture progress" ON public.lecture_progress;

CREATE POLICY "Users can update their own lecture progress"
ON public.lecture_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = uuid)
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.physical_fitness_test;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.physical_fitness_test;
DROP POLICY IF EXISTS "Enable update for users based on uuid" ON public.physical_fitness_test;

DROP POLICY IF EXISTS "Users can insert their own PFT data" ON public.physical_fitness_test;

CREATE POLICY "Users can insert their own PFT data"
ON public.physical_fitness_test
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Users can view their own PFT data or students they teach" ON public.physical_fitness_test;

CREATE POLICY "Users can view their own PFT data or students they teach"
ON public.physical_fitness_test
FOR SELECT
TO authenticated
USING (public.current_user_can_view_student(uuid));

DROP POLICY IF EXISTS "Users can update their own PFT data" ON public.physical_fitness_test;

CREATE POLICY "Users can update their own PFT data"
ON public.physical_fitness_test
FOR UPDATE
TO authenticated
USING (auth.uid() = uuid)
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.quiz;
DROP POLICY IF EXISTS "Policy with table joins" ON public.quiz;

DROP POLICY IF EXISTS "Authenticated users can view quizzes" ON public.quiz;

CREATE POLICY "Authenticated users can view quizzes"
ON public.quiz
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.quiz_progress;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quiz_progress;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.quiz_progress;
DROP POLICY IF EXISTS "Policy with table joins" ON public.quiz_progress;

DROP POLICY IF EXISTS "Students can insert their own quiz progress" ON public.quiz_progress;

CREATE POLICY "Students can insert their own quiz progress"
ON public.quiz_progress
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.current_user_is_teacher()
);

DROP POLICY IF EXISTS "Users can view their own quiz progress or students they teach" ON public.quiz_progress;

CREATE POLICY "Users can view their own quiz progress or students they teach"
ON public.quiz_progress
FOR SELECT
TO authenticated
USING (public.current_user_can_view_student(user_id));

DROP POLICY IF EXISTS "Students can update their own quiz progress" ON public.quiz_progress;

CREATE POLICY "Students can update their own quiz progress"
ON public.quiz_progress
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND NOT public.current_user_is_teacher()
)
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.current_user_is_teacher()
);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.student_class_code;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.student_class_code;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.student_class_code;
DROP POLICY IF EXISTS "Enable update for users based on uuid" ON public.student_class_code;

DROP POLICY IF EXISTS "Users can delete their own student class membership" ON public.student_class_code;

CREATE POLICY "Users can delete their own student class membership"
ON public.student_class_code
FOR DELETE
TO authenticated
USING (auth.uid() = uuid);

DROP POLICY IF EXISTS "Users can insert their own student class membership" ON public.student_class_code;

CREATE POLICY "Users can insert their own student class membership"
ON public.student_class_code
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Users can view their own student class membership or students they teach" ON public.student_class_code;

CREATE POLICY "Users can view their own student class membership or students they teach"
ON public.student_class_code
FOR SELECT
TO authenticated
USING (public.current_user_can_view_student(uuid));

DROP POLICY IF EXISTS "Users can update their own student class membership" ON public.student_class_code;

CREATE POLICY "Users can update their own student class membership"
ON public.student_class_code
FOR UPDATE
TO authenticated
USING (auth.uid() = uuid)
WITH CHECK (auth.uid() = uuid);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.teacher_class_code;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teacher_class_code;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teacher_class_code;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.teacher_class_code;

DROP POLICY IF EXISTS "Teachers can delete their own class codes" ON public.teacher_class_code;

CREATE POLICY "Teachers can delete their own class codes"
ON public.teacher_class_code
FOR DELETE
TO authenticated
USING (
  public.current_user_is_teacher()
  AND auth.uid() = uuid
);

DROP POLICY IF EXISTS "Teachers can insert their own class codes" ON public.teacher_class_code;

CREATE POLICY "Teachers can insert their own class codes"
ON public.teacher_class_code
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_is_teacher()
  AND auth.uid() = uuid
);

DROP POLICY IF EXISTS "Teachers can view their own class codes" ON public.teacher_class_code;

CREATE POLICY "Teachers can view their own class codes"
ON public.teacher_class_code
FOR SELECT
TO authenticated
USING (
  public.current_user_is_teacher()
  AND auth.uid() = uuid
);

DROP POLICY IF EXISTS "Teachers can update their own class codes" ON public.teacher_class_code;

CREATE POLICY "Teachers can update their own class codes"
ON public.teacher_class_code
FOR UPDATE
TO authenticated
USING (
  public.current_user_is_teacher()
  AND auth.uid() = uuid
)
WITH CHECK (
  public.current_user_is_teacher()
  AND auth.uid() = uuid
);
