ALTER TABLE public.quiz_progress
ADD CONSTRAINT quiz_progress_user_id_quiz_id_key UNIQUE (user_id, quiz_id);
