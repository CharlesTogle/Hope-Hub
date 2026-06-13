--
-- Auto-create profile and related rows when a user signs up.
-- Eliminates reliance on the account-verification page RPC call,
-- preventing orphaned auth.users rows without corresponding profiles.
--

-- Make register_user SECURITY DEFINER so it bypasses RLS when called
-- from the frontend RPC (AccountVerification.tsx fallback path) and
-- from the trigger below.
CREATE OR REPLACE FUNCTION public.register_user(
  p_user_id          uuid,
  p_full_name        text,
  p_email            text,
  p_user_type        text,
  p_lecture_progress jsonb,
  p_class_code       text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
begin
  insert into profile (uuid, full_name, email, user_type)
  values (p_user_id, p_full_name, p_email, p_user_type::user_type);

  insert into lecture_progress (uuid, lecture_progress)
  values (p_user_id, p_lecture_progress);

  insert into physical_fitness_test (uuid)
  values (p_user_id);

  if p_user_type = 'student' then
    insert into student_class_code (uuid, class_code)
    values (p_user_id, p_class_code);
  elsif p_user_type = 'teacher' then
    insert into teacher_class_code (uuid, class_code)
    values (p_user_id, p_class_code);
  end if;

exception
  when others then
    raise exception 'Registration failed: %', SQLERRM;
end;
$$;

-- Trigger function: inserts profile + related rows from auth.users metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name         text;
  v_user_type         text;
  v_class_code        text;
  v_lecture_progress  jsonb;
BEGIN
  v_full_name        := COALESCE(NEW.raw_user_meta_data ->> 'fullName', NEW.email);
  v_user_type        := COALESCE(NEW.raw_user_meta_data ->> 'userType', 'student');
  v_class_code       := NEW.raw_user_meta_data ->> 'classCode';
  v_lecture_progress := COALESCE(NEW.raw_user_meta_data -> 'lectureProgress', '[]'::jsonb);

  INSERT INTO public.profile (uuid, full_name, email, user_type)
  VALUES (NEW.id, v_full_name, NEW.email, v_user_type::public.user_type);

  INSERT INTO public.lecture_progress (uuid, lecture_progress)
  VALUES (NEW.id, v_lecture_progress);

  INSERT INTO public.physical_fitness_test (uuid)
  VALUES (NEW.id);

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

-- Apply the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
