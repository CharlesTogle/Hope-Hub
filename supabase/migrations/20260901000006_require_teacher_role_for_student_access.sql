CREATE OR REPLACE FUNCTION public.current_user_teaches_student(p_student_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile AS p
    INNER JOIN public.teacher_class_code AS tcc ON tcc.uuid = p.uuid
    INNER JOIN public.student_class_code AS scc ON scc.class_code = tcc.class_code
    WHERE p.uuid = auth.uid()
      AND p.user_type = 'teacher'
      AND scc.uuid = p_student_uuid
  );
$$;
