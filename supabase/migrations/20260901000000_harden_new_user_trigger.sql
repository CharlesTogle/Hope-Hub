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
  v_user_type := CASE
    WHEN NEW.raw_app_meta_data ->> 'userType' = 'admin' THEN 'admin'
    WHEN NEW.raw_user_meta_data ->> 'userType' IN ('student', 'teacher')
      THEN NEW.raw_user_meta_data ->> 'userType'
    ELSE 'student'
  END;
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
