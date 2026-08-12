import PageHeading from '@/components/PageHeading';
import LectureIntroduction from '@/components/lectures/LectureIntroComponent';
import { useState } from 'react';
import { Lessons } from '@/utilities/Lessons';
import supabase from '@/client/supabase';
import LectureProgress from '@/utilities/LectureProgress';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import { useQuery } from '@tanstack/react-query';
import { lectureKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { LessonStatus, LectureProgressItem } from '@/types/lecture';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { getUserFacingError } from '@/utilities/user-facing-errors';

const LectureFilters: LessonStatus[] = ['Done', 'Pending', 'Incomplete'];
const AllFilters = ['All', ...LectureFilters] as const;
type LectureFilter = typeof AllFilters[number];

export default function Lectures() {
  const [activeFilter, setActiveFilter] = useState<LectureFilter>('All');
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const isTeacher = profile?.user_type === 'teacher';
  const navigate = useNavigate();

  const { data: storedProgress = LectureProgress(), isLoading, isError, error, refetch } = useQuery({
    queryKey: lectureKeys.progress(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_progress')
        .select('lecture_progress')
        .eq('uuid', userId)
        .single();
      if (error) throw error;
      if (!data?.lecture_progress) return LectureProgress();
      return data.lecture_progress;
    },
    enabled: !!userId,
  });

  // Compute filtered lessons inline — no useEffect, no derived state
  const activeLessons = Lessons.map((lesson) => {
    const progress = storedProgress.find((p: LectureProgressItem) => p.key === lesson.key);
    const status: LessonStatus = progress ? progress.status : 'Incomplete';
    return { ...lesson, status };
  }).filter((lesson) => activeFilter === 'All' || lesson.status === activeFilter);

  if (isLoading) return <Loading />;
  if (isError) {
    return <ErrorMessage title="We couldn't load your lectures" description={getUserFacingError(error, 'load')} onRetry={() => void refetch()} />;
  }

  return (
    <section
      id='lectures'
      className='flex justify-between flex-col overflow-x-hidden h-screen bg-background overflow-y-scroll'
    >
      <div>
        <PageHeading text='Lectures & Video Lessons' className='bg-background z-2' />
        <div
          id='lectures-container'
          className='w-[90%] flex flex-col items-center mr-auto ml-auto relative mb-10 lg:w-[80%] overflow-visible'
        >
          <div
            id='buttons-wrapper'
            className='sticky top-0 pt-[3%] pb-[2%] self-start w-full flex flex-col-reverse items-center justify-between flex-wrap bg-background z-10 lg:flex-nowrap lg:flex-row'
          >
            {!isTeacher && (
              <div
                id='buttons'
                className='rounded-sm bg-secondary-dark-blue w-full h-fit flex justify-between flex-nowrap lg:w-fit'
              >
                {AllFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={
                      `text-white text-center font-content py-2 min-w-1/8 px-2 text-sm lg:w-auto lg:px-5 transition-colors ${
                        filter === AllFilters[0] ? 'rounded-l-sm' : ''
                      } ${
                        filter === AllFilters[AllFilters.length - 1] ? 'rounded-r-sm' : ''
                      } ` +
                      (filter === activeFilter
                        ? 'bg-primary-yellow text-secondary-dark-blue'
                        : 'bg-secondary-dark-blue hover:bg-gray-700')
                    }
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
            {!isTeacher ? (
              <p className='font-content text-xs w-full text-wrap self-start mb-5 lg:text-base lg:w-6/10 lg:mb-0 lg:pl-5'>
                <strong>Note:</strong> You can only take the quiz after reading or watching the
                lecture. (Lecture will be automatically marked as done after taking the quiz.)
              </p>
            ) : (
              <p className='font-content text-xs w-full text-wrap self-start mb-5 lg:text-base lg:w-6/10 lg:mb-0 lg:pl-5'>
                <strong>Note:</strong> You are using an <b>Admin</b> and is viewing a simple version
                of the lectures. To access the full features, please use a <b>Student Account</b>
              </p>
            )}
          </div>
          <div
            id='lecture-introductions'
            className='flex justify-center space-y-3 flex-col items-center overflow-x-visible mt-5'
          >
            {activeLessons.length > 0 ? (
              activeLessons.map((lesson) => (
                <LectureIntroduction
                  lectureKey={lesson.key}
                  key={lesson.key}
                  title={lesson.title}
                  introduction={lesson.introduction}
                  status={lesson.status}
                  onClick={() => navigate(`lecture/${lesson.key}`)}
                  isTeacher={isTeacher}
                />
              ))
            ) : (
              <p className='font-content font-bold text-2xl pt-15'>No Available Data</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}
