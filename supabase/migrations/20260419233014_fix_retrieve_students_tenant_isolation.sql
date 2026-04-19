-- Fix MT-2: Add tenant isolation to retrieve_students_by_class RPC
-- Blocks cross-teacher access by verifying auth.uid() owns the class code

CREATE OR REPLACE FUNCTION public.retrieve_students_by_class(
  class_code_input text
) RETURNS TABLE(
  full_name text,
  email text,
  uuid uuid,
  lecture_progress jsonb,
  pre_physical_fitness_test json,
  post_physical_fitness_test json,
  quiz_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  -- Verify the calling teacher owns this class code
  IF NOT EXISTS (
    SELECT 1 FROM teacher_class_code
    WHERE teacher_class_code.uuid = auth.uid()
    AND teacher_class_code.class_code = class_code_input
  ) THEN
    RAISE EXCEPTION 'Access denied: class code does not belong to current user';
  END IF;

  RETURN QUERY
  SELECT
    p.full_name,
    p.email,
    p.uuid,
    (
      SELECT jsonb_agg(lp.lecture_progress)
      FROM lecture_progress lp
      WHERE lp.uuid = p.uuid
    ) AS lecture_progress,
    (
      SELECT json_agg(pft.pre_physical_fitness_test)
      FROM physical_fitness_test pft
      WHERE pft.uuid = p.uuid
    ) AS pre_physical_fitness_test,
    (
      SELECT json_agg(pft.post_physical_fitness_test)
      FROM physical_fitness_test pft
      WHERE pft.uuid = p.uuid
    ) AS post_physical_fitness_test,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'quiz_number', qr.quiz_id,
          'score', qr.score,
          'status', qr.status,
          'total_items', qr.total_items
        )
      )
      FROM quiz_progress qr
      WHERE qr.user_id = p.uuid
    ) AS quiz_data
  FROM profile p
  INNER JOIN student_class_code scc ON scc.uuid = p.uuid
  WHERE scc.class_code = class_code_input;
END;
$$;
