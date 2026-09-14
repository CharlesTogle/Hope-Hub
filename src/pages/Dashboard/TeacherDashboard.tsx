import Banner from '@/components/dashboard/Banner';
import ProfileSidebar from '@/components/dashboard/ProfileSidebar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { useProfilePicture } from '@/hooks/use-profile-picture';
import { useEffect, useMemo } from 'react';
import { onProfileChange as onProfileChangeUtil } from '@/utilities/onProfileChange';
import ClassCode from '@/components/dashboard/ClassCode';
import AddClassCode from '@/components/dashboard/AddClassCode';
import { Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '@/components/Loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { toast } from 'sonner';
import { removeTeacherClassCode } from '@/mutations/class-mutations';
import { fetchTeacherClassCodes } from '@/queries/dashboard-queries';
import type { ClassCode as ClassCodeData } from '@/types/student';

export default function TeacherDashboard() {
  const { profile, logout } = useAuthStore();
  const userID = profile?.uuid ?? null;
  const teacherName = profile?.full_name ?? '';
  const showAddClassModal = useUIStore((state) => state.teacherDashboard.showAddClassModal);
  const confirmingRemove = useUIStore(
    (state) => state.teacherDashboard.confirmingRemoveClassCode,
  );
  const setShowAddClassModal = useUIStore((state) => state.setTeacherAddClassModalOpen);
  const setConfirmingRemove = useUIStore(
    (state) => state.setTeacherConfirmingRemoveClassCode,
  );
  const resetTeacherDashboard = useUIStore((state) => state.resetTeacherDashboard);
  const profilePictureFile = useProfilePicture(userID);
  const memoizedFile = useMemo(
    () => profilePictureFile,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profilePictureFile?.size],
  );
  useEffect(() => resetTeacherDashboard, [resetTeacherDashboard]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleProfileChange = async (file: File, fileName = 'profilePicture') => {
    const result = await onProfileChangeUtil(userID, file, fileName);
    if (result.success) toast.success('Your profile picture was updated.');
    else toast.error(result.error);
  };

  const { data: classCodes = [], isLoading } = useQuery<ClassCodeData[]>({
    queryKey: classKeys.codes(userID ?? ''),
    queryFn: () => fetchTeacherClassCodes(userID ?? ''),
    enabled: !!userID,
  });

  const removeMutation = useMutation({
    mutationFn: (classCode: string) => removeTeacherClassCode(userID ?? '', classCode),
    onSuccess: (_data, classCode) => {
      queryClient.setQueryData<ClassCodeData[]>(classKeys.codes(userID ?? ''), (current) =>
        current?.filter((code) => code.class_code !== classCode),
      );
      queryClient.invalidateQueries({ queryKey: classKeys.codes(userID ?? '') });
    },
    onError: () => toast.error('Failed to remove class. Please try again.'),
  });

  const handleAddClass = () => setShowAddClassModal(true);

  const handleClassCreated = () => {
    queryClient.invalidateQueries({ queryKey: classKeys.codes(userID ?? '') });
    setShowAddClassModal(false);
  };

  const handleRemoveClass = (classCode: string) => {
    setConfirmingRemove(classCode);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.remoteSignOutSucceeded) {
      toast.warning("You were signed out on this device, but we couldn't confirm it with the server.");
    }
    navigate('/', { replace: true });
  };

  if (!userID || isLoading) return <Loading />;

  return (
    <section id='teacher-dashboard parent-container relative'>
      <div className='absolute left-0'>
        {showAddClassModal && (
          <AddClassCode
            onAdd={handleClassCreated}
            setModalShown={setShowAddClassModal}
          />
        )}
        {confirmingRemove && (
          <div className='fixed inset-0 z-999 flex items-center justify-center px-5'>
            <div className='absolute inset-0 bg-black/60' onClick={() => setConfirmingRemove(null)} />
            <div role='dialog' aria-modal='true' aria-labelledby='retire-class-title' className='relative max-w-lg bg-white p-6 rounded-lg shadow-xl font-content'>
              <h2 id='retire-class-title' className='text-2xl font-heading text-primary-blue'>Retire this class?</h2>
              <p className='mt-4'>
                Members will immediately lose access to lectures, quizzes, and PFT. Lecture and quiz history remains, and PFT results are retained but inactive under this permanently retired code.
              </p>
              <div className='flex justify-end gap-3 mt-6'>
                <button type='button' className='px-4 py-2 border border-accent-blue text-accent-blue rounded-sm' onClick={() => setConfirmingRemove(null)} disabled={removeMutation.isPending}>Cancel</button>
                <button type='button' className='px-4 py-2 bg-[#DB4E34] text-white rounded-sm' onClick={() => { const code = confirmingRemove; setConfirmingRemove(null); removeMutation.mutate(code); }} disabled={removeMutation.isPending}>Permanently Retire Class</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <DashboardContainer>
        <div className='flex gap-4 flex-col relative min-h-[90vh] w-full pt-10! lg:pt-40'>
          <div className='flex lg:items-center lg:gap-10 md:gap-10  font-heading-small text-primary-blue z-3'>
            <div>
              <p className='text-2xl lg:text-4xl'>
                Hello, Prof. {teacherName}{' '}
              </p>
              <hr className='w-60 border-1 border-primary-yellow mt-2 mb-2' />
              <p className='text-xl lg:text-2xl'>
                Welcome to Teacher’s Dashboard
              </p>
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
          <Banner isStudent={false} name={teacherName} />{' '}
          <div id='class-codes' className='flex flex-wrap w-full gap-4 pb-40'>
            {classCodes.map(code => (
              <ClassCode
                key={code.class_code}
                name={code.class_name}
                classCode={code.class_code}
                classColor={code.class_color}
                onRemove={() => handleRemoveClass(code.class_code)}
              />
            ))}
          </div>
          <Plus
            color='white'
            strokeWidth={2}
            className='bg-[#999999] w-12 h-12 p-2 rounded-full absolute bottom-20 right-0 cursor-pointer hover:bg-[#777777] transition-colors'
            onClick={handleAddClass}
          />
        </div>
        <div className='h-full hidden lg:block pt-10'>
          <ProfileSidebar
            memoizedFile={memoizedFile}
            name={teacherName}
            onProfileChange={handleProfileChange}
            userType='Teacher'
            handleLogout={handleLogout}
          ></ProfileSidebar>
        </div>
      </DashboardContainer>
    </section>
  );
}
