import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Search from '@/components/dashboard/Search';
import Table from '@/components/dashboard/ViewClass/Table';
import { Lessons } from '@/utilities/Lessons';
import { Quizzes } from '@/utilities/Quizzes';
import { getStudentsByClassCode } from '@/services/getStudentDataByClassCode';
import { cleanStudentData } from '@/services/cleanStudentData';
import { useUserId } from '@/hooks/useUserId';
import supabase from '@/client/supabase';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import Loading from '@/components/Loading';
import {
  generateStudentExcel,
  downloadExcel,
  generateFilename,
} from '@/utilities/exportStudentExcel';
import { Download } from 'lucide-react';

const transformDataLecture = data => {
  return data.map(item => ({
    Type: 'Lecture',
    LessonNumber: item.key,
  }));
};

const transformQuizData = data => {
  return data.map(item => ({
    Type: 'Quiz',
    QuizNumber: item.quiz_number,
  }));
};

function combineObjects (lectureArray, quizArray) {
  return [...lectureArray, ...quizArray];
}
const getTableHeadings = (activeFilter, data) => {
  const headings = ['Name', 'Email'];
  if (activeFilter === 'Lecture') {
    data.forEach(data => {
      headings.push(`Lesson ${data.LessonNumber}`);
    });
  } else if (activeFilter === 'Quiz') {
    data.forEach(data => {
      headings.push(`Quiz ${data.QuizNumber}`);
    });
  } else if (activeFilter === 'All') {
    data.forEach(data => {
      if (data.Type === 'Lecture') {
        headings.push(`Lesson ${data.LessonNumber}`);
      } else if (data.Type === 'Quiz') {
        headings.push(`Quiz ${data.QuizNumber}`);
      }
    });
    headings.push('Pre Test Record');
    headings.push('Post Test Record');
  }
  return headings;
};

export default function ViewClass () {
  //initialize data

  const params = useParams();
  const userId = useUserId();
  const [lecturesData, setLecturesData] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [defaultStudentData, setDefaultStudentData] = useState([]);
  const [lectureSubFilter, setLectureSubFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [quizSubFilter, setQuizSubFilter] = useState('none');
  const [isDataReady, setIsDataReady] = useState(false);
  const [activeStudentData, setActiveStudentData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [headings, setHeadings] = useState([]);
  const [isOwnershipChecked, setIsOwnershipChecked] = useState(false);
  const [hasOwnership, setHasOwnership] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const Filters = ['All', 'Lecture', 'Quiz'];
  const classCode = params.classCode;

  useEffect(() => {
    async function fetchData () {
      const resolvedQuizData = new Promise(resolve => {
        resolve(Quizzes());
      });

      const quizzes = await resolvedQuizData;
      const lectures = transformDataLecture(Lessons);
      const quizData = transformQuizData(quizzes);
      const combined = combineObjects(lectures, quizData);
      setHeadings(getTableHeadings('All', combined));
      setLecturesData(lectures);
      setQuizData(quizData);
      setCombinedData(combined);
    }

    fetchData();
    setIsDataReady(true);
  }, []);

  // Check if the current teacher owns this class
  const checkClassOwnership = async () => {
    if (!userId || !classCode) {
      setHasOwnership(false);
      setIsOwnershipChecked(true);
      setIsLoading(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teacher_class_code')
        .select('class_code')
        .eq('uuid', userId)
        .eq('class_code', classCode)
        .single();

      if (error || !data) {
        setHasOwnership(false);
      } else {
        setHasOwnership(true);
      }
    } catch (err) {
      setHasOwnership(false);
    }
    setIsLoading(false);
    setIsOwnershipChecked(true);
  };

  useEffect(() => {
    checkClassOwnership();
  }, [userId, classCode]);

  useEffect(() => {
    if (!isOwnershipChecked) {
      setIsLoading(true);
    }
    if (isOwnershipChecked && hasOwnership) {
      getStudentData();
    }
  }, [isOwnershipChecked, hasOwnership]);

  const getStudentData = async () => {
    try {
      setIsLoading(true);
      const allStudentData = await getStudentsByClassCode(classCode);
      const cleanedStudentData = cleanStudentData(allStudentData);
      console.log('all student data:', allStudentData);
      setActiveStudentData(cleanedStudentData);
      setDefaultStudentData(cleanedStudentData);
    } catch (error) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = searchTerm => {
    setSearchTerm(searchTerm);

    // Get the current filtered data based on active filter and sub-filter
    let baseData = defaultStudentData;

    // Apply lecture sub-filter if in Lecture mode
    if (activeFilter === 'Lecture' && lectureSubFilter !== 'all') {
      if (lectureSubFilter === 'done') {
        baseData = defaultStudentData.filter(student => {
          return (
            student.Lesson1 === 'Done' &&
            student.Lesson2 === 'Done' &&
            student.Lesson3 === 'Done'
          );
        });
      } else if (lectureSubFilter === 'pending') {
        baseData = defaultStudentData.filter(student => {
          return (
            student.Lesson1 === 'Pending' ||
            student.Lesson2 === 'Pending' ||
            student.Lesson3 === 'Pending'
          );
        });
      } else if (lectureSubFilter === 'incomplete') {
        baseData = defaultStudentData.filter(student => {
          return (
            student.Lesson1 === 'Incomplete' ||
            student.Lesson2 === 'Incomplete' ||
            student.Lesson3 === 'Incomplete'
          );
        });
      }
    }
    // Apply search filter
    if (searchTerm.trim() === '') {
      setActiveStudentData(baseData);
    } else {
      const filteredData = baseData.filter(student =>
        student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setActiveStudentData(filteredData);
    }
  };
  const handleFilterChange = filter => {
    setActiveFilter(filter);
    setSearchTerm(''); // Clear search when changing filters

    if (filter === 'Lecture') {
      setHeadings(getTableHeadings(filter, lecturesData));
      setActiveStudentData(defaultStudentData);
      handleLectureSubFilterChange('all');
    } else if (filter === 'Quiz') {
      setHeadings(getTableHeadings(filter, quizData));
      setActiveStudentData(defaultStudentData);
      handleQuizSubFilterChange('none');
    } else if (filter === 'All') {
      setHeadings(getTableHeadings(filter, combinedData));
      setActiveStudentData(defaultStudentData);
      setLectureSubFilter('all');
      setQuizSubFilter('none');
    }
  };

  const handleLectureSubFilterChange = filter => {
    setLectureSubFilter(filter);
    setSearchTerm(''); // Clear search when changing sub-filters

    if (filter === 'all') {
      setActiveStudentData(defaultStudentData);
    } else if (filter === 'done') {
      // Filter students who have completed all lessons
      const filteredData = defaultStudentData.filter(student => {
        return (
          student.Lesson1 === 'Done' &&
          student.Lesson2 === 'Done' &&
          student.Lesson3 === 'Done'
        );
      });
      setActiveStudentData(filteredData);
    } else if (filter === 'pending') {
      // Filter students who have at least one pending lesson
      const filteredData = defaultStudentData.filter(student => {
        return (
          student.Lesson1 === 'Pending' ||
          student.Lesson2 === 'Pending' ||
          student.Lesson3 === 'Pending'
        );
      });
      setActiveStudentData(filteredData);
    } else if (filter === 'incomplete') {
      // Filter students who have at least one incomplete lesson
      const filteredData = defaultStudentData.filter(student => {
        return (
          student.Lesson1 === 'Incomplete' ||
          student.Lesson2 === 'Incomplete' ||
          student.Lesson3 === 'Incomplete'
        );
      });
      setActiveStudentData(filteredData);
    }
  };

  const handleQuizSubFilterChange = filter => {
    setQuizSubFilter(filter);
    setSearchTerm(''); // Clear search when changing sub-filters

    if (filter === 'none') {
      setActiveStudentData(defaultStudentData);
    } else {
      // Create a copy of the data to sort
      let sortedData = [...defaultStudentData];

      if (filter === 'ascending' || filter === 'descending') {
        // Sort by quiz scores
        sortedData.sort((a, b) => {
          // Calculate average score for each student across all quizzes
          let scoreA = 0;
          let scoreB = 0;
          let quizCountA = 0;
          let quizCountB = 0;

          // Check all quiz columns
          Object.keys(a).forEach(key => {
            if (key.startsWith('Quiz') && a[key] && a[key] !== 'Pending') {
              const match = a[key].match(/(\d+)\/(\d+)/);
              if (match) {
                scoreA += parseInt(match[1]) / parseInt(match[2]);
                quizCountA++;
              }
            }
          });

          Object.keys(b).forEach(key => {
            if (key.startsWith('Quiz') && b[key] && b[key] !== 'Pending') {
              const match = b[key].match(/(\d+)\/(\d+)/);
              if (match) {
                scoreB += parseInt(match[1]) / parseInt(match[2]);
                quizCountB++;
              }
            }
          });

          // Calculate average scores (handle division by zero)
          const avgA = quizCountA > 0 ? scoreA / quizCountA : 0;
          const avgB = quizCountB > 0 ? scoreB / quizCountB : 0;

          return filter === 'ascending' ? avgA - avgB : avgB - avgA;
        });
      }

      setActiveStudentData(sortedData);
    }
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

  if (isOwnershipChecked && !hasOwnership && !isLoading) {
    return <ErrorMessage text='Error 404' subText='Class Not Found' />;
  }

  if (!isOwnershipChecked || isLoading || !isDataReady) {
    return <Loading />;
  }

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
                  key={index}
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
                  <span className='text-sm font-content text-gray-600'>
                    Status:
                  </span>
                  <div className='flex bg-gray-100 rounded-md p-1'>
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'done', label: 'Done' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'incomplete', label: 'Incomplete' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleLectureSubFilterChange(option.value)
                        }
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
                  <span className='text-sm font-content text-gray-600'>
                    Sort by score:
                  </span>
                  <div className='flex bg-gray-100 rounded-md p-1'>
                    {[
                      { value: 'none', label: 'Default' },
                      { value: 'ascending', label: 'Low to High' },
                      { value: 'descending', label: 'High to Low' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleQuizSubFilterChange(option.value)}
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
                  <span className='text-sm font-content text-gray-500 italic'>
                    Showing all content
                  </span>
                </div>
              )}
            </div>
          </div>{' '}
          <div
            id='search'
            className='w-full lg:w-[40%] flex items-center gap-3'
          >
            <Search onSearch={handleSearch} />
          </div>
        </div>{' '}
        <div className='w-full mt-10'>
          <div className='overflow-x-auto'>
            <Table headings={headings} content={activeStudentData}></Table>
          </div>
        </div>
      </div>
    </section>
  );
}
