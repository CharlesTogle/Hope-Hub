-- Add a narrow RPC for PFT summary reads.
-- The caller can only read:
-- - their own summary
-- - or a student they currently teach

CREATE OR REPLACE FUNCTION public.get_pft_summary_for_viewer(
  p_student_uuid uuid,
  p_test_type text
) RETURNS TABLE(
  full_name text,
  email text,
  pft_data jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_test_type NOT IN ('pre-test', 'post-test') THEN
    RAISE EXCEPTION 'Invalid test type';
  END IF;

  IF auth.uid() <> p_student_uuid
     AND NOT public.current_user_teaches_student(p_student_uuid) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    p.full_name,
    p.email,
    CASE
      WHEN p_test_type = 'pre-test' THEN pft.pre_physical_fitness_test
      ELSE pft.post_physical_fitness_test::jsonb
    END AS pft_data
  FROM public.profile AS p
  INNER JOIN public.physical_fitness_test AS pft
    ON pft.uuid = p.uuid
  WHERE p.uuid = p_student_uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pft_summary_for_viewer(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pft_summary_for_viewer(uuid, text) TO authenticated;
