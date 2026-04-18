import { Lessons } from '@/utilities/Lessons';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import { useEffect, useState } from 'react';
import LecturePDF from '@/components/lectures/LecturePDF';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import supabase from '@/client/supabase';
import { useUserId } from '@/hooks/useUserId';
import LectureProgress from '@/utilities/LectureProgress';
import Loading from '@/components/Loading';
export default function LecturePage () {
  const { lessonNumber } = useParams();
  const userId = useUserId();
  const [isLectureDone, setIsLectureDone] = useState(false);
  const [lectureProgress, setLectureProgress] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const selectedLessonNumber = Number(lessonNumber);

  const lessonDetails = Lessons.find(
    lesson => lesson.key === selectedLessonNumber,
  );

  useEffect(() => {
    async function getType () {
      if (!userId) {
        return;
      }
      const { data, error: userTypeError } = await supabase
        .from('profile')
        .select('user_type')
        .eq('uuid', userId)
        .single();
      if (userTypeError) {
        return;
      }
      setIsTeacher(data.user_type === 'teacher');
      setIsLoading(false);
    }
    getType();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(true);
      return;
    }
    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from('lecture_progress')
        .select('lecture_progress')
        .eq('uuid', userId)
        .single();
      if (error || !data || !data.lecture_progress) {
        setLectureProgress(LectureProgress());
      } else {
        setLectureProgress(data.lecture_progress);
      }
      setDataLoaded(true);
    };
    fetchProgress();
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (!dataLoaded) return;
    if (!lectureProgress || lectureProgress.length === 0) return;
    const updateProgress = async () => {
      const updatedProgress = lectureProgress.map(progress => {
        if (progress.key === selectedLessonNumber) {
          if (progress.status === 'Done') setIsLectureDone(true);
          if (progress.status === 'Incomplete')
            return { ...progress, status: 'Pending' };
        }
        return progress;
      });
      const isChanged =
        JSON.stringify(lectureProgress) !== JSON.stringify(updatedProgress);
      if (isChanged) {
        setLectureProgress(updatedProgress);
        await supabase
          .from('lecture_progress')
          .update({ lecture_progress: updatedProgress })
          .eq('uuid', userId);
      }
    };
    updateProgress();
  }, [lectureProgress, selectedLessonNumber, dataLoaded, userId]);

  const handleLectureFinish = async () => {
    if (isLectureDone) return;
    const lectureToUpdate = lectureProgress.find(
      p => p.key === selectedLessonNumber,
    );
    if (!lectureToUpdate) return;
    const updatedProgress = lectureProgress.map(p =>
      p.key === selectedLessonNumber ? { ...p, status: 'Done' } : p,
    );
    setLectureProgress(updatedProgress);
    setIsLectureDone(true);
    await supabase
      .from('lecture_progress')
      .update({ lecture_progress: updatedProgress })
      .eq('uuid', userId);

    await supabase
      .from('quiz_progress')
      .insert([
        { user_id: userId, quiz_id: selectedLessonNumber, status: 'Pending' },
      ]);
  };

  if (!lessonDetails) {
    return <ErrorMessage text='Error 404' subText='Page not found' />;
  }
  if (!dataLoaded || isLoading) {
    return <Loading />;
  }

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
