import { Lessons } from '@/utilities/Lessons';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import LecturePDF from '@/components/lectures/LecturePDF';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { toast } from 'sonner';
import supabase from '@/client/supabase';
import LectureProgress from '@/utilities/LectureProgress';
import Loading from '@/components/Loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lectureKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { LectureProgressItem } from '@/types/lecture';

export default function LecturePage() {
  const { lessonNumber } = useParams<{ lessonNumber: string }>();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const isTeacher = profile?.user_type === 'teacher';
  const selectedLessonNumber = Number(lessonNumber);
  const queryClient = useQueryClient();

  const lessonDetails = Lessons.find((lesson) => lesson.key === selectedLessonNumber);

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

  const pendingMutation = useMutation({
    mutationFn: async (): Promise<LectureProgressItem[]> => {
      const updated = lectureProgress.map((progressItem: LectureProgressItem) =>
        progressItem.key === selectedLessonNumber
          ? { ...progressItem, status: 'Pending' as const }
          : progressItem,
      );

      const { error } = await supabase
        .from('lecture_progress')
        .update({ lecture_progress: updated })
        .eq('uuid', userId);

      if (error) {
        throw error;
      }

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(lectureKeys.progress(userId ?? ''), updated);
    },
    onError: () => toast.error('Failed to save lecture progress. Please try again.'),
  });

  const currentLectureProgress = lectureProgress.find(
    (progressItem: LectureProgressItem) => progressItem.key === selectedLessonNumber,
  );
  const isLectureDone = currentLectureProgress?.status === 'Done';

  useEffect(() => {
    if (!userId || isTeacher || pendingMutation.isPending) {
      return;
    }

    if (currentLectureProgress?.status === 'Incomplete') {
      pendingMutation.mutate();
    }
  }, [
    currentLectureProgress?.status,
    isTeacher,
    pendingMutation,
    selectedLessonNumber,
    userId,
  ]);

  const finishMutation = useMutation({
    mutationFn: async (): Promise<LectureProgressItem[]> => {
      const updated = lectureProgress.map((p: LectureProgressItem) =>
        p.key === selectedLessonNumber ? { ...p, status: 'Done' as const } : p,
      );
      await supabase
        .from('lecture_progress')
        .update({ lecture_progress: updated })
        .eq('uuid', userId);

      const { data: existingQuizProgress, error: quizProgressError } = await supabase
        .from('quiz_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('quiz_id', selectedLessonNumber)
        .maybeSingle();

      if (quizProgressError) {
        throw quizProgressError;
      }

      if (!existingQuizProgress) {
        const { error: insertError } = await supabase
          .from('quiz_progress')
          .insert([
            {
              user_id: userId,
              quiz_id: selectedLessonNumber,
              status: 'Pending' as const,
            },
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(lectureKeys.progress(userId ?? ''), updated);
    },
    onError: () => toast.error('Failed to finish lecture. Please try again.'),
  });

  const handleLectureFinish = () => {
    if (isLectureDone) return;
    finishMutation.mutate();
  };

  if (!lessonDetails) return <ErrorMessage text='Error 404' subText='Page not found' />;
  if (isLoading || !userId) return <Loading />;

  const { pdf, introduction, title, quizLink } = lessonDetails;

  return (
    <section id='lecture-page' className='min-h-screen bg-gray-background'>
      <PageHeading text='Lecture Lessons' />
      <div className='w-[90%] lg:w-[80%] mx-auto mt-5 flex flex-col items-center pb-10'>
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
