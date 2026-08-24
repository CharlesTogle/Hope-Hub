UPDATE public.quiz_progress AS qp
SET status = 'Pending'::public.quiz_status
FROM public.lecture_progress AS lp
WHERE qp.user_id = lp.uuid
  AND qp.status = 'Locked'::public.quiz_status
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(lp.lecture_progress) AS lecture
    WHERE (lecture->>'key')::smallint = qp.quiz_id
      AND lecture->>'status' = 'Done'
  );
