import { Lessons } from '@/utilities/Lessons';
import { useParams } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import { useState } from 'react';
import LecturePDF from '@/components/lectures/LecturePDF';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import supabase from '@/client/supabase';
import LectureProgress from '@/utilities/LectureProgress';
import Loading from '@/components/Loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lectureKeys, profileKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';

export default function LecturePage() {
  const { lessonNumber } = useParams();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const selectedLessonNumber = Number(lessonNumber);
  const queryClient = useQueryClient();

  const lessonDetails = Lessons.find((lesson) => lesson.key === selectedLessonNumber);

  // Fetch user type
  const { data: isTeacher = false } = useQuery({
    queryKey: [...profileKeys.detail(userId ?? ''), 'user-type'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profile')
        .select('user_type')
        .eq('uuid', userId)
        .single();
      return data?.user_type === 'teacher';
    },
    enabled: !!userId,
  });

  // Fetch lecture progress
  const { data: lectureProgress = LectureProgress(), isLoading } = useQuery({
    queryKey: lectureKeys.progress(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_progress')
        .select('lecture_progress')
        .eq('uuid', userId)
        .single();
      if (error || !data?.lecture_progress) return LectureProgress();
      return data.lecture_progress;
    },
    enabled: !!userId,
  });

  // Mark as Pending on mount (if Incomplete)
  useMutation({
    mutationFn: async () => {
      const updated = lectureProgress.map((p) =>
        p.key === selectedLessonNumber && p.status === 'Incomplete'
          ? { ...p, status: 'Pending' }
          : p,
      );
      const changed = JSON.stringify(lectureProgress) !== JSON.stringify(updated);
      if (changed) {
        await supabase
          .from('lecture_progress')
          .update({ lecture_progress: updated })
          .eq('uuid', userId);
        queryClient.setQueryData(lectureKeys.progress(userId ?? ''), updated);
      }
    },
  });

  const isLectureDone = lectureProgress.find((p) => p.key === selectedLessonNumber)?.status === 'Done';

  const finishMutation = useMutation({
    mutationFn: async () => {
      const updated = lectureProgress.map((p) =>
        p.key === selectedLessonNumber ? { ...p, status: 'Done' } : p,
      );
      await supabase
        .from('lecture_progress')
        .update({ lecture_progress: updated })
        .eq('uuid', userId);
      await supabase
        .from('quiz_progress')
        .insert([{ user_id: userId, quiz_id: selectedLessonNumber, status: 'Pending' }]);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(lectureKeys.progress(userId ?? ''), updated);
    },
  });

  const handleLectureFinish = () => {
    if (isLectureDone) return;
    finishMutation.mutate();
  };

  if (!lessonDetails) return <ErrorMessage text="Error 404" subText="Page not found" />;
  if (isLoading || !userId) return <Loading />;

  const { pdf, introduction, title, quizLink } = lessonDetails;

  return (
    <section id="lecture-page" className="min-h-screen bg-gray-background">
      <PageHeading text="Lecture Lessons" />
      <div className="w-[90%] lg:w-[80%] mx-auto mt-5 flex flex-col items-center pb-10">
        <LecturePDF
          userID={userId}
          lectureNumber={selectedLessonNumber}
          title={title}
          introduction={introduction}
          pdfLink={pdf}
          quizLink={quizLink}
          onTimerEnd={handleLectureFinish}
          isLectureDone={isLectureDone}
          isTeacher={isTeacher}
        />
      </div>
    </section>
  );
}
