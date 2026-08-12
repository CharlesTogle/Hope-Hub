import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '@/components/dashboard/ViewClass/Table';
import { getStudentsByClassCode } from '@/services/getStudentDataByClassCode';
import { cleanStudentData } from '@/services/cleanStudentData';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import { logger } from '@/utilities/logger';
import {
  generateStudentCsv,
  downloadCsv,
  generateExportFilename,
} from '@/utilities/exportStudentCsv';
import { useQuery } from '@tanstack/react-query';
import { classKeys, quizKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import ClassViewHeader from '@/components/dashboard/ViewClass/ClassViewHeader';
import ClassViewFilters from '@/components/dashboard/ViewClass/ClassViewFilters';
import {
  buildQuizFilterItems,
  filterStudentsByLectureStatus,
  filterStudentsBySearchTerm,
  getTableHeadings,
  lecturesData,
  sortStudentsByQuizAverage,
  viewClassFilters,
  type FilterItem,
  type FilterValue,
} from '@/lib/view-class';
import {
  fetchQuizNumbers,
  fetchTeacherClassOwnership,
} from '@/queries/dashboard-queries';
import type { CleanedStudent } from '@/types/student';
import { getUserFacingError } from '@/utilities/user-facing-errors';

export default function ViewClass () {
  const params = useParams<{ classCode: string }>();
  const navigate = useNavigate();
  const classCode = params.classCode;
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;

  const activeFilter = useUIStore((state) => state.viewClass.activeFilter);
  const lectureSubFilter = useUIStore((state) => state.viewClass.lectureSubFilter);
  const quizSubFilter = useUIStore((state) => state.viewClass.quizSubFilter);
  const searchTerm = useUIStore((state) => state.viewClass.searchTerm);
  const isExporting = useUIStore((state) => state.viewClass.isExporting);
  const setActiveFilter = useUIStore((state) => state.setViewClassFilter);
  const setLectureSubFilter = useUIStore(
    (state) => state.setViewClassLectureSubFilter,
  );
  const setQuizSubFilter = useUIStore((state) => state.setViewClassQuizSubFilter);
  const setSearchTerm = useUIStore((state) => state.setViewClassSearchTerm);
  const setIsExporting = useUIStore((state) => state.setViewClassIsExporting);
  const resetViewClass = useUIStore((state) => state.resetViewClass);

  useEffect(() => resetViewClass, [resetViewClass]);

  const { data: quizNumbers = [], isLoading: quizLoading, isError: quizError, error: quizRequestError, refetch: refetchQuizNumbers } = useQuery<number[]>({
    queryKey: quizKeys.list(),
    queryFn: fetchQuizNumbers,
  });

  const quizData = buildQuizFilterItems(quizNumbers);
  const combinedData = [...lecturesData, ...quizData];

  const { data: hasOwnership = false, isLoading: ownershipLoading, isError: ownershipError, error: ownershipRequestError, refetch: refetchOwnership } = useQuery({
    queryKey: ['class', 'ownership', userId ?? '', classCode ?? ''],
    queryFn: () => fetchTeacherClassOwnership(userId ?? '', classCode ?? ''),
    enabled: !!userId && !!classCode,
  });

  const { data: defaultStudentData = [], isLoading: studentsLoading, isError: studentsError, error: studentsRequestError, refetch: refetchStudents } = useQuery<CleanedStudent[]>({
    queryKey: classKeys.students(classCode ?? ''),
    queryFn: async () => {
      const allStudentData = await getStudentsByClassCode(classCode ?? '');
      return cleanStudentData(allStudentData);
    },
    enabled: !!classCode && hasOwnership,
  });

  // Compute headings inline — no state
  const activeData: FilterItem[] =
    activeFilter === 'Lecture' ? lecturesData
    : activeFilter === 'Quiz' ? quizData
    : combinedData;
  const headings = getTableHeadings(activeFilter, activeData);

  // Compute activeStudentData inline — no state
  let filteredStudentData = defaultStudentData;

  if (activeFilter === 'Lecture') {
    filteredStudentData = filterStudentsByLectureStatus(
      filteredStudentData,
      lectureSubFilter,
    );
  }

  if (activeFilter === 'Quiz') {
    filteredStudentData = sortStudentsByQuizAverage(
      filteredStudentData,
      quizSubFilter,
    );
  }

  const activeStudentData = filterStudentsBySearchTerm(
    filteredStudentData,
    searchTerm,
  );

  const handleFilterChange = (filter: FilterValue) => {
    setActiveFilter(filter);
    setSearchTerm('');
    if (filter === 'Lecture') { setLectureSubFilter('all'); setQuizSubFilter('none'); }
    else if (filter === 'Quiz') { setQuizSubFilter('none'); setLectureSubFilter('all'); }
    else { setLectureSubFilter('all'); setQuizSubFilter('none'); }
  };

  const handleExportClass = async () => {
    setIsExporting(true);
    try {
      const csvData = await generateStudentCsv(
        defaultStudentData,
        classCode ?? null,
        lecturesData.length,
        quizData.length,
      );
      if (!csvData) {
        return;
      }
      const filename = generateExportFilename('class', classCode ?? '');
      downloadCsv(csvData, filename);
    } catch (error) {
      logger.error('Error exporting CSV', error);
      toast.error('Failed to export CSV file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (ownershipLoading || studentsLoading || quizLoading) return <Loading />;
  if (quizError || ownershipError || studentsError) {
    const requestError = quizRequestError ?? ownershipRequestError ?? studentsRequestError;
    const retry = quizError ? refetchQuizNumbers : ownershipError ? refetchOwnership : refetchStudents;
    return <ErrorMessage title="We couldn't load this class" description={getUserFacingError(requestError, 'load')} onRetry={() => void retry()} />;
  }
  if (!hasOwnership) {
    return (
      <ErrorMessage
        title='Class not found'
        description='We could not find that class or you may not have access to it.'
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <section className='parent-container' id='view-class'>
      <div className='content-container w-[90%]!'>
        <div className='self-start w-full'>
          <ClassViewHeader
            classCode={classCode}
            isExporting={isExporting}
            isDisabled={defaultStudentData.length === 0}
            onExport={handleExportClass}
          />
        </div>{' '}
        <ClassViewFilters
          activeFilter={activeFilter}
          lectureSubFilter={lectureSubFilter}
          quizSubFilter={quizSubFilter}
          searchTerm={searchTerm}
          onFilterChange={handleFilterChange}
          onLectureSubFilterChange={setLectureSubFilter}
          onQuizSubFilterChange={setQuizSubFilter}
          onSearchTermChange={setSearchTerm}
          filters={viewClassFilters}
        />{' '}
        <div className='w-full mt-10'>
          <div className='overflow-x-auto'>
            <Table
              headings={headings}
              content={activeStudentData}
              classCode={classCode ?? ''}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
