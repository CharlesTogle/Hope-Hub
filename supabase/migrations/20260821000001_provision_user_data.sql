-- Keep the three student data areas available for new and existing users.

CREATE OR REPLACE FUNCTION public.ensure_current_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_metadata jsonb;
  v_user_type text;
  v_lecture_progress jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT email, raw_user_meta_data
  INTO v_email, v_metadata
  FROM auth.users
  WHERE id = v_user_id;

  v_user_type := CASE
    WHEN v_metadata ->> 'userType' IN ('admin', 'teacher')
      THEN v_metadata ->> 'userType'
    ELSE 'student'
  END;
  v_lecture_progress := COALESCE(v_metadata -> 'lectureProgress', '[]'::jsonb);

  INSERT INTO public.profile (uuid, full_name, email, user_type)
  VALUES (
    v_user_id,
    COALESCE(NULLIF(v_metadata ->> 'fullName', ''), v_email),
    v_email,
    v_user_type::public.user_type
  )
  ON CONFLICT (uuid) DO NOTHING;

  INSERT INTO public.lecture_progress (uuid, lecture_progress)
  VALUES (v_user_id, v_lecture_progress)
  ON CONFLICT (uuid) DO NOTHING;

  INSERT INTO public.physical_fitness_test (uuid)
  VALUES (v_user_id)
  ON CONFLICT (uuid) DO NOTHING;

  INSERT INTO public.quiz_progress (user_id, quiz_id, status)
  SELECT v_user_id, q.id, 'Locked'::public.quiz_status
  FROM public.quiz AS q
  ON CONFLICT (user_id, quiz_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_current_user_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_data() TO authenticated;

INSERT INTO public.quiz_progress (user_id, quiz_id, status)
SELECT u.id, q.id, 'Locked'::public.quiz_status
FROM auth.users AS u
CROSS JOIN public.quiz AS q
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quiz_progress AS qp
  WHERE qp.user_id = u.id
    AND qp.quiz_id = q.id
)
ON CONFLICT (user_id, quiz_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_user_type text;
  v_class_code text;
  v_lecture_progress jsonb;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'fullName', NEW.email);
  v_user_type := COALESCE(NEW.raw_user_meta_data ->> 'userType', 'student');
  v_class_code := NEW.raw_user_meta_data ->> 'classCode';
  v_lecture_progress := COALESCE(NEW.raw_user_meta_data -> 'lectureProgress', '[]'::jsonb);

  INSERT INTO public.profile (uuid, full_name, email, user_type)
  VALUES (NEW.id, v_full_name, NEW.email, v_user_type::public.user_type);

  INSERT INTO public.lecture_progress (uuid, lecture_progress)
  VALUES (NEW.id, v_lecture_progress);

  INSERT INTO public.physical_fitness_test (uuid)
  VALUES (NEW.id);

  INSERT INTO public.quiz_progress (user_id, quiz_id, status)
  SELECT NEW.id, q.id, 'Locked'::public.quiz_status
  FROM public.quiz AS q
  ON CONFLICT (user_id, quiz_id) DO NOTHING;

  IF v_user_type = 'student' THEN
    INSERT INTO public.student_class_code (uuid, class_code)
    VALUES (NEW.id, v_class_code);
  ELSIF v_user_type = 'teacher' THEN
    INSERT INTO public.teacher_class_code (uuid, class_code)
    VALUES (NEW.id, v_class_code);
  END IF;

  RETURN NEW;
END;
$$;
