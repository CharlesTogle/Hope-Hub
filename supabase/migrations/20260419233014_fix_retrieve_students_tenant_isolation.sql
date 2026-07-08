-- Fix MT-2: Add tenant isolation to retrieve_students_by_class RPC
-- Blocks cross-teacher access by verifying auth.uid() owns the class code
-- Uses CTEs to aggregate student progress in a single pass

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
  WITH class_students AS (
    SELECT p.full_name, p.email, p.uuid
    FROM profile p
    INNER JOIN student_class_code scc ON scc.uuid = p.uuid
    WHERE scc.class_code = class_code_input
  ),
  lecture_agg AS (
    SELECT lp.uuid, jsonb_agg(lp.lecture_progress) AS lecture_progress
    FROM lecture_progress lp
    WHERE lp.uuid IN (SELECT cs.uuid FROM class_students cs)
    GROUP BY lp.uuid
  ),
  pft_agg AS (
    SELECT pft.uuid,
      json_agg(pft.pre_physical_fitness_test) AS pre_physical_fitness_test,
      json_agg(pft.post_physical_fitness_test) AS post_physical_fitness_test
    FROM physical_fitness_test pft
    WHERE pft.uuid IN (SELECT cs.uuid FROM class_students cs)
    GROUP BY pft.uuid
  ),
  quiz_agg AS (
    SELECT qr.user_id,
      jsonb_agg(
        jsonb_build_object(
          'quiz_number', qr.quiz_id,
          'score', qr.score,
          'status', qr.status,
          'total_items', qr.total_items
        )
      ) AS quiz_data
    FROM quiz_progress qr
    WHERE qr.user_id IN (SELECT cs.uuid FROM class_students cs)
    GROUP BY qr.user_id
  )
  SELECT
    cs.full_name,
    cs.email,
    cs.uuid,
    COALESCE(la.lecture_progress, '[]'::jsonb) AS lecture_progress,
    COALESCE(pa.pre_physical_fitness_test, '[]'::json) AS pre_physical_fitness_test,
    COALESCE(pa.post_physical_fitness_test, '[]'::json) AS post_physical_fitness_test,
    COALESCE(qa.quiz_data, '[]'::jsonb) AS quiz_data
  FROM class_students cs
  LEFT JOIN lecture_agg la ON la.uuid = cs.uuid
  LEFT JOIN pft_agg pa ON pa.uuid = cs.uuid
  LEFT JOIN quiz_agg qa ON qa.user_id = cs.uuid;
END;
$$;
