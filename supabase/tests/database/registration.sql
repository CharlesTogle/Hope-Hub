BEGIN;

SELECT plan(17);

SELECT ok(
  to_regclass('public.orphaned_profile_archive') IS NOT NULL,
  'orphaned profiles have a secure archive'
);

INSERT INTO public.quiz (title, description, questions)
VALUES ('Registration integration quiz', 'Created for registration testing', '[]');

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'integration-student@example.com',
  'not-used-in-this-test',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"fullName":"Integration Student","userType":"student","lectureProgress":[{"lecture":1}]}',
  now(),
  now()
);

SELECT is(
  (SELECT full_name FROM public.profile WHERE uuid = '00000000-0000-0000-0000-000000000001'),
  'Integration Student',
  'creating an auth user creates its profile from metadata'
);

SELECT is(
  (SELECT lecture_progress FROM public.lecture_progress WHERE uuid = '00000000-0000-0000-0000-000000000001'),
  '[{"lecture":1}]'::jsonb,
  'creating an auth user creates lecture progress from metadata'
);

SELECT ok(
  EXISTS (SELECT 1 FROM public.physical_fitness_test WHERE uuid = '00000000-0000-0000-0000-000000000001'),
  'creating an auth user creates a physical fitness test row'
);

SELECT ok(
  EXISTS (SELECT 1 FROM public.student_class_code WHERE uuid = '00000000-0000-0000-0000-000000000001'),
  'creating a student auth user creates a student class-code row'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.quiz_progress AS qp
    JOIN public.quiz AS q ON q.id = qp.quiz_id
    WHERE qp.user_id = '00000000-0000-0000-0000-000000000001'
      AND q.title = 'Registration integration quiz'
      AND qp.status = 'Locked'
  ),
  'creating an auth user creates locked quiz progress'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated', 'integration-teacher@example.com', 'not-used-in-this-test', now(),
  '{"provider":"email","providers":["email"]}',
  '{"fullName":"Integration Teacher","userType":"teacher"}', now(), now()
);

SELECT is(
  (SELECT user_type::text FROM public.profile WHERE uuid = '00000000-0000-0000-0000-000000000002'),
  'teacher',
  'creating a teacher auth user creates a teacher profile'
);

SELECT ok(
  EXISTS (SELECT 1 FROM public.teacher_class_code WHERE uuid = '00000000-0000-0000-0000-000000000002'),
  'creating a teacher auth user creates a teacher class-code row'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated', 'authenticated', 'untrusted-admin@example.com', 'not-used-in-this-test', now(),
  '{"provider":"email","providers":["email"]}',
  '{"fullName":"Untrusted Admin","userType":"admin"}', now(), now()
);

SELECT is(
  (SELECT user_type::text FROM public.profile WHERE uuid = '00000000-0000-0000-0000-000000000003'),
  'student',
  'untrusted signup metadata cannot create an admin profile'
);

SELECT ok(
  EXISTS (SELECT 1 FROM public.student_class_code WHERE uuid = '00000000-0000-0000-0000-000000000003'),
  'untrusted admin metadata receives student provisioning'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000004',
  'authenticated', 'authenticated', 'trusted-admin@example.com', 'not-used-in-this-test', now(),
  '{"provider":"email","providers":["email"],"userType":"admin"}',
  '{"fullName":"Trusted Admin"}', now(), now()
);

SELECT is(
  (SELECT user_type::text FROM public.profile WHERE uuid = '00000000-0000-0000-0000-000000000004'),
  'admin',
  'only service-controlled app metadata can create an admin profile'
);

UPDATE public.student_class_code
SET class_code = 'legacy-teacher-code'
WHERE uuid = '00000000-0000-0000-0000-000000000001';

INSERT INTO public.teacher_class_code (uuid, class_code)
VALUES ('00000000-0000-0000-0000-000000000003', 'legacy-teacher-code');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);

SELECT is(
  public.current_user_teaches_student('00000000-0000-0000-0000-000000000001'),
  false,
  'a non-teacher cannot gain student access through a stale teacher class'
);

RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

SELECT throws_like(
  $$UPDATE public.profile
    SET user_type = 'admin'
    WHERE uuid = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied',
  'an authenticated user cannot change their profile role'
);

RESET ROLE;

SELECT is(
  to_regprocedure('public.ensure_current_user_data()')::text,
  NULL,
  'client-callable provisioning RPC is removed'
);

SELECT is(
  to_regprocedure('public.register_user(uuid,text,text,text,jsonb,text)')::text,
  NULL,
  'parameterized registration RPC is removed'
);

SELECT throws_ok(
  $$INSERT INTO public.profile (uuid, full_name, email, user_type)
    VALUES ('00000000-0000-0000-0000-000000000099', 'Orphan', 'orphan@example.com', 'student')$$,
  '23503',
  'insert or update on table "profile" violates foreign key constraint "profile_auth_user_fkey"',
  'a profile must reference an auth user'
);

DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT is_empty(
  $$SELECT 1
    WHERE EXISTS (SELECT 1 FROM public.profile WHERE uuid = '00000000-0000-0000-0000-000000000001')
       OR EXISTS (SELECT 1 FROM public.lecture_progress WHERE uuid = '00000000-0000-0000-0000-000000000001')
       OR EXISTS (SELECT 1 FROM public.physical_fitness_test WHERE uuid = '00000000-0000-0000-0000-000000000001')
       OR EXISTS (SELECT 1 FROM public.student_class_code WHERE uuid = '00000000-0000-0000-0000-000000000001')
       OR EXISTS (SELECT 1 FROM public.quiz_progress WHERE user_id = '00000000-0000-0000-0000-000000000001')$$,
  'deleting an auth user cascades through all provisioned rows'
);

SELECT * FROM finish();

ROLLBACK;
