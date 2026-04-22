import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Search from '@/components/dashboard/Search';
import Table from '@/components/dashboard/ViewClass/Table';
import { Lessons } from '@/utilities/Lessons';
import { getStudentsByClassCode } from '@/services/getStudentDataByClassCode';
import { cleanStudentData } from '@/services/cleanStudentData';
import supabase from '@/client/supabase';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import Loading from '@/components/Loading';
import {
  generateStudentExcel,
  downloadExcel,
  generateFilename,
} from '@/utilities/exportStudentExcel';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { classKeys, quizKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';

// Static data — derived from static import at module level
const lecturesData = Lessons.map(item => ({ Type: 'Lecture', LessonNumber: item.key }));

const getTableHeadings = (activeFilter, data) => {
  const headings = ['Name', 'Email'];
  if (activeFilter === 'Lecture') {
    data.forEach(d => headings.push(`Lesson ${d.LessonNumber}`));
  } else if (activeFilter === 'Quiz') {
    data.forEach(d => headings.push(`Quiz ${d.QuizNumber}`));
  } else {
    data.forEach(d => {
      if (d.Type === 'Lecture') headings.push(`Lesson ${d.LessonNumber}`);
      else if (d.Type === 'Quiz') headings.push(`Quiz ${d.QuizNumber}`);
    });
    headings.push('Pre Test Record', 'Post Test Record');
  }
  return headings;
};

const Filters = ['All', 'Lecture', 'Quiz'];

export default function ViewClass () {
  const params = useParams();
  const classCode = params.classCode;
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;

  const [activeFilter, setActiveFilter] = useState('All');
  const [lectureSubFilter, setLectureSubFilter] = useState('all');
  const [quizSubFilter, setQuizSubFilter] = useState('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: rawQuizData = [], isLoading: quizLoading } = useQuery({
    queryKey: quizKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from('quiz').select('quiz_number');
      return error ? [] : data;
    },
  });

  const quizData = rawQuizData.map(item => ({ Type: 'Quiz', QuizNumber: item.quiz_number }));
  const combinedData = [...lecturesData, ...quizData];

  const { data: hasOwnership = false, isLoading: ownershipLoading } = useQuery({
    queryKey: ['class', 'ownership', userId ?? '', classCode ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_class_code')
        .select('class_code')
        .eq('uuid', userId)
        .eq('class_code', classCode)
        .single();
      return !error && !!data;
    },
    enabled: !!userId && !!classCode,
  });

  const { data: defaultStudentData = [], isLoading: studentsLoading } = useQuery({
    queryKey: classKeys.students(classCode ?? ''),
    queryFn: async () => {
      const allStudentData = await getStudentsByClassCode(classCode);
      return cleanStudentData(allStudentData);
    },
    enabled: !!classCode && hasOwnership,
  });

  // Compute headings inline — no state
  const activeData =
    activeFilter === 'Lecture' ? lecturesData
    : activeFilter === 'Quiz' ? quizData
    : combinedData;
  const headings = getTableHeadings(activeFilter, activeData);

  // Compute activeStudentData inline — no state
  const lessonKeys = student => Object.keys(student).filter(k => k.startsWith('Lesson'));

  let filteredStudentData = defaultStudentData;

  if (activeFilter === 'Lecture' && lectureSubFilter !== 'all') {
    if (lectureSubFilter === 'done') {
      filteredStudentData = defaultStudentData.filter(s => lessonKeys(s).every(k => s[k] === 'Done'));
    } else if (lectureSubFilter === 'pending') {
      filteredStudentData = defaultStudentData.filter(s => lessonKeys(s).some(k => s[k] === 'Pending'));
    } else if (lectureSubFilter === 'incomplete') {
      filteredStudentData = defaultStudentData.filter(s => lessonKeys(s).some(k => s[k] === 'Incomplete'));
    }
  }

  if (activeFilter === 'Quiz' && quizSubFilter !== 'none') {
    const avgScore = student => {
      let total = 0, count = 0;
      Object.keys(student).forEach(key => {
        if (key.startsWith('Quiz') && student[key] && student[key] !== 'Pending') {
          const match = student[key].match(/(\d+)\/(\d+)/);
          if (match) { total += parseInt(match[1]) / parseInt(match[2]); count++; }
        }
      });
      return count > 0 ? total / count : 0;
    };
    filteredStudentData = [...filteredStudentData].sort((a, b) =>
      quizSubFilter === 'ascending' ? avgScore(a) - avgScore(b) : avgScore(b) - avgScore(a),
    );
  }

  const activeStudentData = searchTerm.trim()
    ? filteredStudentData.filter(s => s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredStudentData;

  const handleFilterChange = filter => {
    setActiveFilter(filter);
    setSearchTerm('');
    if (filter === 'Lecture') { setLectureSubFilter('all'); setQuizSubFilter('none'); }
    else if (filter === 'Quiz') { setQuizSubFilter('none'); setLectureSubFilter('all'); }
    else { setLectureSubFilter('all'); setQuizSubFilter('none'); }
  };

  const handleExportClass = async () => {
    setIsExporting(true);
    try {
      const excelData = await generateStudentExcel(
        defaultStudentData,
        classCode,
        lecturesData.length,
        quizData.length,
      );
      const filename = generateFilename('class', classCode);
      downloadExcel(excelData, filename);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (ownershipLoading || studentsLoading || quizLoading) return <Loading />;
  if (!hasOwnership) return <ErrorMessage text='Error 404' subText='Class Not Found' />;

  return (
    <section className='parent-container' id='view-class'>
      <div className='content-container w-[90%]!'>
        <div className='self-start w-full'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <p className='font-heading-small text-3xl text-primary-blue self-start'>
                Class Code: <span className='text-black'>{classCode}</span>
              </p>
              <hr className='h-0 w-50 mt-3 border-1 border-primary-yellow' />
            </div>
            <button
              onClick={handleExportClass}
              disabled={isExporting || defaultStudentData.length === 0}
              className='bg-primary-blue text-white px-6 py-2 rounded-md font-content text-sm flex items-center gap-2 hover:brightness-90 disabled:brightness-75 disabled:cursor-not-allowed transition-all'
            >
              <Download className='w-4 h-4' />
              {isExporting ? 'Exporting...' : 'Export Class Data'}
            </button>
          </div>
        </div>{' '}
        <div
          className='self-start mt-5 flex w-full justify-between flex-col lg:flex-row gap-4'
          id='options'
        >
          <div className='flex flex-col gap-3'>
            <div
              id='buttons'
              className='rounded-sm bg-secondary-dark-blue w-fit h-fit flex items-center flex-nowrap lg:w-fit'
            >
              {Filters.map((filter, index) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={
                    `text-white text-center font-content py-2 min-w-1/8 px-5 text-sm lg:w-auto lg:px-5 transition-colors sticky top-0 ${
                      index === 0 ? 'rounded-l-sm' : ''
                    } ${index === Filters.length - 1 ? 'rounded-r-sm' : ''} ` +
                    (filter === activeFilter
                      ? 'bg-primary-yellow text-secondary-dark-blue'
                      : 'bg-secondary-dark-blue hover:bg-gray-700')
                  }
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className='h-10 flex items-center'>
              {activeFilter === 'Lecture' && (
                <div className='flex items-center gap-2 animate-fadeIn'>
                  <span className='text-sm font-content text-gray-600'>Status:</span>
                  <div className='flex bg-gray-100 rounded-md p-1'>
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'done', label: 'Done' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'incomplete', label: 'Incomplete' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setLectureSubFilter(option.value)}
                        className={`px-3 py-1 text-xs font-content rounded transition-colors ${
                          lectureSubFilter === option.value
                            ? 'bg-secondary-dark-blue text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeFilter === 'Quiz' && (
                <div className='flex items-center gap-2 animate-fadeIn'>
                  <span className='text-sm font-content text-gray-600'>Sort by score:</span>
                  <div className='flex bg-gray-100 rounded-md p-1'>
                    {[
                      { value: 'none', label: 'Default' },
                      { value: 'ascending', label: 'Low to High' },
                      { value: 'descending', label: 'High to Low' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setQuizSubFilter(option.value)}
                        className={`px-3 py-1 text-xs font-content rounded transition-colors ${
                          quizSubFilter === option.value
                            ? 'bg-secondary-dark-blue text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeFilter === 'All' && (
                <div className='flex items-center gap-2 animate-fadeIn'>
                  <span className='text-sm font-content text-gray-500 italic'>Showing all content</span>
                </div>
              )}
            </div>
          </div>{' '}
          <div id='search' className='w-full lg:w-[40%] flex items-center gap-3'>
            <Search onSearch={setSearchTerm} />
          </div>
        </div>{' '}
        <div className='w-full mt-10'>
          <div className='overflow-x-auto'>
            <Table headings={headings} content={activeStudentData} />
          </div>
        </div>
      </div>
    </section>
  );
}
