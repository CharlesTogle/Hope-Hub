import Banner from '@/components/dashboard/Banner';
import Statistics from '@/components/dashboard/Statistics';
import supabase from '@/client/supabase';
import { useUserId } from '@/hooks/useUserId';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinClass from '@/components/dashboard/JoinClass';
import ProfileSidebar from '@/components/dashboard/ProfileSidebar';
import { useName, useProfilePicture } from '@/hooks/useDashboardData';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { onProfileChange as onProfileChangeUtil } from '@/utilities/onProfileChange';
import { LogOut } from 'lucide-react';
import QuizScoreTable from '@/components/dashboard/QuizScoreTable';
import Loading from '@/components/Loading';

export default function StudentDashboard () {
  const userID = useUserId();
  const [preTestFinished, setPreTestFinished] = useState(false);
  const [postTestFinished, setPostTestFinished] = useState(false);
  const [lectureProgress, setLectureProgress] = useState({
    completed: 0,
    incomplete: 0,
    pending: 0,
    total: 10,
  });
  const [quizProgress, setQuizProgress] = useState({
    completed: 0,
    incomplete: 0,
    pending: 0,
    total: 2,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizLoading, setQuizLoading] = useState(false);
  const [classCode, setClassCode] = useState(null);
  const [tempClassCode, setTempClassCode] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [quizCount, setQuizCount] = useState(0);
  const navigate = useNavigate();

  const [profilePictureFile, setProfilePictureFile] = useProfilePicture(userID);
  const memoizedFile = useMemo(
    () => profilePictureFile,
    [profilePictureFile?.name, profilePictureFile?.size],
  );
  const studentName = useName(userID);
  let sampleProgress = {
    completed: 7,
    incomplete: 10,
    pending: 8,
  };
  sampleProgress = {
    ...sampleProgress,
    total: Object.values(sampleProgress).reduce((acc, value) => acc + value, 0),
  };

  const getQuizProgress = async () => {
    if (!userID) {
      setIsLoading(true);
      return;
    }

    const { count: quizCount } = await supabase
      .from('quiz')
      .select('*', { count: 'exact' });

    const { data: quizProgress, error: quizError } = await supabase
      .from('quiz_progress')
      .select('status')
      .eq('user_id', userID);

    setQuizCount(quizCount);
    if (quizError) {
      return;
    }
    let completed = 0;
    let incomplete = 0;
    let pending = 0;
    quizProgress.forEach(item => {
      if (item.status === 'Done') completed += 1;
      else if (item.status === 'Pending') pending += 1;
    });

    incomplete = quizCount - (completed + pending);

    setQuizProgress({
      completed,
      incomplete,
      pending,
      total: quizCount,
    });
  };

  const getQuizData = async () => {
    if (!userID || quizCount === 0) {
      setIsLoading(true);
      return;
    }

    setQuizLoading(true);

    const { data: quizData, error: quizDataError } = await supabase
      .from('quiz_progress')
      .select('quiz_id, status, score, total_items, date_taken')
      .eq('user_id', userID);

    if (quizDataError) return;

    const completeQuizData = [];
    for (let index = 1; index <= quizCount; index++) {
      let isFound = false;
      let existingQuiz = null;

      if (quizData) {
        quizData.forEach(element => {
          if (element.quiz_id === index) {
            isFound = true;
            existingQuiz = element;
            return;
          }
        });
      }
      if (isFound && existingQuiz) {
        completeQuizData.push(existingQuiz);
      } else {
        completeQuizData.push({
          quiz_id: index,
          status: 'Incomplete',
          score: undefined,
          total_items: undefined,
          date_taken: undefined,
        });
      }
    }
    setQuizData(completeQuizData);
    setQuizLoading(false);
    setIsLoading(false);
  };

  const getLectureProgress = async () => {
    if (!userID) {
      setIsLoading(true);
      return;
    }
    const { data, error } = await supabase
      .from('lecture_progress')
      .select('lecture_progress')
      .eq('uuid', userID)
      .single();

    if (error) {
      return;
    }

    const lectures = data.lecture_progress || [];
    let completed = 0;
    let incomplete = 0;
    let pending = 0;

    lectures.forEach(item => {
      if (item.status === 'Done') completed += 1;
      else if (item.status === 'Incomplete') incomplete += 1;
      else if (item.status === 'Pending') pending += 1;
    });

    setLectureProgress({
      completed,
      incomplete,
      pending,
      total: lectures.length,
    });
  };

  const getClassCode = async () => {
    if (!userID) {
      setIsLoading(true);
      return;
    }
    const { data, error } = await supabase
      .from('student_class_code')
      .select()
      .single()
      .eq('uuid', userID);
    if (error) {
      setClassCode('');
      return;
    }
    const classCode = data?.class_code;
    if (!classCode) setClassCode(null);
    else {
      setClassCode(classCode);
    }
  };

  useEffect(() => {
    getClassCode();
  }, [userID]);

  useEffect(() => {
    getLectureProgress();
  }, [userID]);

  useEffect(() => {
    getQuizProgress();
  }, [userID]);
  useEffect(() => {
    getQuizData();
  }, [userID, quizCount]);

  useEffect(() => {
    isPreTestFinished().then(setPreTestFinished);
    isPostTestFinished().then(setPostTestFinished);
  }, [userID]);

  const checkIfFinished = async column => {
    if (!userID) {
      setIsLoading(true);
      return;
    }
    const { data: existing, error: fetchError } = await supabase
      .from('physical_fitness_test')
      .select(column)
      .eq('uuid', userID)
      .single();

    if (fetchError) {
      return;
    }
    if (existing[column] && existing[column].finishedTestIndex) {
      const { finishedTestIndex } = existing[column];
      return (
        finishedTestIndex &&
        finishedTestIndex.includes(finishedTestIndex.length - 1)
      );
    }
  };

  const isPreTestFinished = async () => {
    return await checkIfFinished('pre_physical_fitness_test');
  };

  const isPostTestFinished = async () => {
    return await checkIfFinished('post_physical_fitness_test');
  };

  const handlePostTestClick = () => {
    if (postTestFinished) {
      navigate('/physical-fitness-test/summary/post-test');
    }
  };
  const handlePreTestClick = () => {
    if (preTestFinished) {
      navigate('/physical-fitness-test/summary/pre-test');
    }
  };

  const handleLeaveClass = async () => {
    const { error: leaveClassError } = await supabase
      .from('student_class_code')
      .update({ class_code: null })
      .eq('uuid', userID);
    if (leaveClassError) {
      return;
    }
    setClassCode(null);
  };

  const handleJoinClass = async () => {
    // Validate that the class code exists in the teacher's class_code table
    const { count, error: fetchError } = await supabase
      .from('teacher_class_code')
      .select('*', { count: 'exact', head: true })
      .eq('class_code', tempClassCode);

    if (fetchError || count === 0) {
      alert('Invalid class code. Please check and try again.');
      return;
    }

    const { error: joinClassError } = await supabase
      .from('student_class_code')
      .update({ class_code: tempClassCode })
      .eq('uuid', userID);
    if (joinClassError) {
      alert('Error joining class. Please try again.');
      return;
    }
    setIsJoiningClass(false);
    setClassCode(tempClassCode);
  };

  const handleProfileChange = async (file, fileName = 'profilePicture') => {
    await onProfileChangeUtil(userID, file, fileName);
  };

  // Optionally, add a guard for userID before rendering:
  if (!userID || isLoading || isQuizLoading) {
    return <Loading />;
  }
  const handleLogout = async () => {
    supabase.auth.signOut().then(navigate('/auth/login'));
    localStorage.removeItem('lectureProgress');
    localStorage.removeItem('physicalFitnessData');
  };
  return (
    <section className='student-dashboard parent-container'>
      {isJoiningClass && (
        <JoinClass
          setTempClassCode={setTempClassCode}
          tempClassCode={tempClassCode}
          handleClose={() => setIsJoiningClass(false)}
          handleJoinClass={handleJoinClass}
        ></JoinClass>
      )}
      <div className='lg:px-10 px-5 md:px-10 mt-5 mb-5 lg:mb-0 grid grid-cols-2 place-content-center w-full lg:w-fit lg:block '>
        <div>
          <h1 className='font-heading text-primary-blue text-4xl lg:text-5xl'>
            Dashboard
          </h1>
          <hr className='lg:w-90 border-1 border-primary-yellow mt-3' />
        </div>
        <div>
          <button
            className='lg:hidden ml-auto text-base font-bold font-content px-3 py-2 text-white bg-[#DB4E34] flex items-center gap-2 cursor-pointer'
            onClick={() => handleLogout()}
          >
            <LogOut className='w-6 h-6' /> Logout
          </button>
        </div>
      </div>
      <DashboardContainer>
        <div id='content' className='w-full mb-20'>
          <Banner
            name={studentName}
            classCode={classCode}
            onClassLeave={handleLeaveClass}
            onClassJoinOpen={() => setIsJoiningClass(true)}
          ></Banner>
          <div id='statistics' className='grid grid-cols-2 gap-5'>
            <div id='lectures'>
              <Statistics progress={lectureProgress} type='Lectures' />
            </div>
            <div id='quizzes'>
              <Statistics progress={quizProgress} type='Quizzes' />
            </div>
          </div>
          <div id='quiz-scores' className='w-full text-center'>
            <QuizScoreTable
              quizData={quizData}
              quizCount={quizCount}
            ></QuizScoreTable>
          </div>
          <div
            id='physical-fitness-records'
            className='w-full text-center grid grid-cols-2 gap-5'
          >
            <button
              className='lg:p-7 lg:text-base text-xs p-5 bg-neutral-dark-blue text-white font-content rounded-md hover:brightness-90 cursor-pointer disabled:brightness-80 disabled:cursor-not-allowed'
              disabled={!preTestFinished}
              onClick={() => handlePreTestClick()}
            >
              VIEW PFT - PRE TEST RECORD
            </button>
            <button
              className='lg:p-7 lg:text-base text-xs p-5 bg-neutral-dark-blue text-white font-content rounded-md hover:brightness-90 cursor-pointer disabled:brightness-80 disabled:cursor-not-allowed'
              disabled={!postTestFinished}
              onClick={() => handlePostTestClick()}
            >
              VIEW PFT - POST TEST RECORD
            </button>
          </div>
        </div>
        <div
          id='profile'
          className='hidden sticky w-full h-full max-h-[90vh]! top-0 bg-white lg:flex flex-col items-center justify-start'
        >
          <ProfileSidebar
            handleLogout={handleLogout}
            memoizedFile={memoizedFile}
            onProfileChange={handleProfileChange}
            userType='Student'
            name={studentName}
          />
        </div>
      </DashboardContainer>
    </section>
  );
}
