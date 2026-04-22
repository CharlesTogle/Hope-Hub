import Banner from '@/components/dashboard/Banner';
import Statistics from '@/components/dashboard/Statistics';
import supabase from '@/client/supabase';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinClass from '@/components/dashboard/JoinClass';
import ProfileSidebar from '@/components/dashboard/ProfileSidebar';
import { useStudentName } from '@/hooks/use-student-name';
import { useProfilePicture } from '@/hooks/use-profile-picture';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { onProfileChange as onProfileChangeUtil } from '@/utilities/onProfileChange';
import { LogOut } from 'lucide-react';
import QuizScoreTable from '@/components/dashboard/QuizScoreTable';
import Loading from '@/components/Loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileKeys, lectureKeys, pftKeys, classKeys, quizKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';

export default function StudentDashboard() {
  const { profile, logout } = useAuthStore();
  const userID = profile?.uuid ?? null;
  const [tempClassCode, setTempClassCode] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const studentName = useStudentName(userID);
  const profilePictureFile = useProfilePicture(userID);
  const memoizedFile = useMemo(
    () => profilePictureFile,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profilePictureFile?.size],
  );

  // Lecture progress
  const { data: lectureProgressData, isLoading: lectureLoading } = useQuery({
    queryKey: lectureKeys.progress(userID ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_progress')
        .select('lecture_progress')
        .eq('uuid', userID)
        .single();
      if (error) return { completed: 0, incomplete: 0, pending: 0, total: 0 };
      const lectures = data.lecture_progress || [];
      let completed = 0, incomplete = 0, pending = 0;
      lectures.forEach((item) => {
        if (item.status === 'Done') completed++;
        else if (item.status === 'Incomplete') incomplete++;
        else if (item.status === 'Pending') pending++;
      });
      return { completed, incomplete, pending, total: lectures.length };
    },
    enabled: !!userID,
  });

  // Quiz count
  const { data: quizCount = 0 } = useQuery({
    queryKey: [...quizKeys.all, 'count'],
    queryFn: async () => {
      const { count } = await supabase.from('quiz').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
    enabled: !!userID,
  });

  // Quiz progress stats
  const { data: quizProgressStats, isLoading: quizStatsLoading } = useQuery({
    queryKey: [...quizKeys.all, 'progress-stats', userID ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('status')
        .eq('user_id', userID);
      if (error) return { completed: 0, incomplete: 0, pending: 0, total: quizCount };
      let completed = 0, pending = 0;
      data.forEach((item) => {
        if (item.status === 'Done') completed++;
        else if (item.status === 'Pending') pending++;
      });
      return { completed, incomplete: quizCount - completed - pending, pending, total: quizCount };
    },
    enabled: !!userID && quizCount > 0,
  });

  // Quiz detail data for table
  const { data: quizData = [], isLoading: quizDataLoading } = useQuery({
    queryKey: [...quizKeys.all, 'detail-data', userID ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('quiz_id, status, score, total_items, date_taken')
        .eq('user_id', userID);
      if (error) return [];
      const result = [];
      for (let i = 1; i <= quizCount; i++) {
        const found = data?.find((q) => q.quiz_id === i);
        result.push(found ?? { quiz_id: i, status: 'Incomplete', score: undefined, total_items: undefined, date_taken: undefined });
      }
      return result;
    },
    enabled: !!userID && quizCount > 0,
  });

  // Class code
  const { data: classCode } = useQuery({
    queryKey: classKeys.studentCode(userID ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_class_code')
        .select('class_code')
        .eq('uuid', userID)
        .single();
      if (error) return null;
      return data?.class_code ?? null;
    },
    enabled: !!userID,
  });

  // PFT status
  const { data: pftData } = useQuery({
    queryKey: pftKeys.session(userID ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userID)
        .single();
      if (error) return { preFinished: false, postFinished: false };
      const checkFinished = (col) => {
        const fi = col?.finishedTestIndex;
        return !!(fi && fi.includes(fi.length - 1));
      };
      return {
        preFinished: checkFinished(data.pre_physical_fitness_test),
        postFinished: checkFinished(data.post_physical_fitness_test),
      };
    },
    enabled: !!userID,
  });

  const joinMutation = useMutation({
    mutationFn: async (code) => {
      const { count, error } = await supabase
        .from('teacher_class_code')
        .select('*', { count: 'exact', head: true })
        .eq('class_code', code);
      if (error || count === 0) throw new Error('Invalid class code');
      const { error: joinErr } = await supabase
        .from('student_class_code')
        .update({ class_code: code })
        .eq('uuid', userID);
      if (joinErr) throw joinErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.studentCode(userID ?? '') });
      setIsJoiningClass(false);
    },
    onError: () => alert('Invalid class code or error joining class.'),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('student_class_code')
        .update({ class_code: null })
        .eq('uuid', userID);
      if (error) throw error;
    },
    onSuccess: () => {
      setConfirmingLeave(false);
      queryClient.invalidateQueries({ queryKey: classKeys.studentCode(userID ?? '') });
    },
  });

  const handleLeaveClass = () => {
    if (!confirmingLeave) { setConfirmingLeave(true); return; }
    leaveMutation.mutate();
  };

  const handleJoinClass = () => joinMutation.mutate(tempClassCode);

  const handleProfileChange = async (file, fileName = 'profilePicture') => {
    await onProfileChangeUtil(userID, file, fileName);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const isLoading = lectureLoading || quizStatsLoading || quizDataLoading;

  if (!userID || isLoading) return <Loading />;

  return (
    <section className="student-dashboard parent-container">
      {isJoiningClass && (
        <JoinClass
          setTempClassCode={setTempClassCode}
          tempClassCode={tempClassCode}
          handleClose={() => setIsJoiningClass(false)}
          handleJoinClass={handleJoinClass}
        />
      )}
      <div className="lg:px-10 px-5 md:px-10 mt-5 mb-5 lg:mb-0 grid grid-cols-2 place-content-center w-full lg:w-fit lg:block">
        <div>
          <h1 className="font-heading text-primary-blue text-4xl lg:text-5xl">Dashboard</h1>
          <hr className="lg:w-90 border-1 border-primary-yellow mt-3" />
        </div>
        <div>
          <button
            className="lg:hidden ml-auto text-base font-bold font-content px-3 py-2 text-white bg-[#DB4E34] flex items-center gap-2 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-6 h-6" /> Logout
          </button>
        </div>
      </div>
      <DashboardContainer>
        <div id="content" className="w-full mb-20">
          <Banner
            name={studentName}
            classCode={classCode}
            onClassLeave={handleLeaveClass}
            onClassJoinOpen={() => setIsJoiningClass(true)}
            confirmingLeave={confirmingLeave}
          />
          <div id="statistics" className="grid grid-cols-2 gap-5">
            <div id="lectures">
              <Statistics
                progress={lectureProgressData ?? { completed: 0, incomplete: 0, pending: 0, total: 0 }}
                type="Lectures"
              />
            </div>
            <div id="quizzes">
              <Statistics
                progress={quizProgressStats ?? { completed: 0, incomplete: 0, pending: 0, total: 0 }}
                type="Quizzes"
              />
            </div>
          </div>
          <div id="quiz-scores" className="w-full text-center">
            <QuizScoreTable quizData={quizData} quizCount={quizCount} />
          </div>
          <div id="physical-fitness-records" className="w-full text-center grid grid-cols-2 gap-5">
            <button
              className="lg:p-7 lg:text-base text-xs p-5 bg-neutral-dark-blue text-white font-content rounded-md hover:brightness-90 cursor-pointer disabled:brightness-80 disabled:cursor-not-allowed"
              disabled={!pftData?.preFinished}
              onClick={() => pftData?.preFinished && navigate('/physical-fitness-test/summary/pre-test')}
            >
              VIEW PFT - PRE TEST RECORD
            </button>
            <button
              className="lg:p-7 lg:text-base text-xs p-5 bg-neutral-dark-blue text-white font-content rounded-md hover:brightness-90 cursor-pointer disabled:brightness-80 disabled:cursor-not-allowed"
              disabled={!pftData?.postFinished}
              onClick={() => pftData?.postFinished && navigate('/physical-fitness-test/summary/post-test')}
            >
              VIEW PFT - POST TEST RECORD
            </button>
          </div>
        </div>
        <div
          id="profile"
          className="hidden sticky w-full h-full max-h-[90vh]! top-0 bg-white lg:flex flex-col items-center justify-start"
        >
          <ProfileSidebar
            handleLogout={handleLogout}
            memoizedFile={memoizedFile}
            onProfileChange={handleProfileChange}
            userType="Student"
            name={studentName}
          />
        </div>
      </DashboardContainer>
    </section>
  );
}
