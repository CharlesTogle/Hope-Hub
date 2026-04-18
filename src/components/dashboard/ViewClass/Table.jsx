import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import {
  generateStudentExcel,
  downloadExcel,
  generateFilename,
} from '@/utilities/exportStudentExcel';
import { useState } from 'react';

export default function Table ({ headings, content }) {
  const navigate = useNavigate();
  const [exportingStudent, setExportingStudent] = useState(null);
  const handleViewTestRecord = (student, testType) => {
    if (!student || !student.uuid) {
      return;
    }
    const summaryType =
      testType === 'Pre Test Record' ? 'pre-test' : 'post-test';
    navigate(
      `/physical-fitness-test/summary/${summaryType}?student=${student.uuid}`,
    );
  };

  const handleExportStudent = async student => {
    setExportingStudent(student.uuid);
    try {
      // Calculate lesson and quiz counts from headings
      const lessonCount = headings.filter(h => h.startsWith('Lesson')).length;
      const quizCount = headings.filter(h => h.startsWith('Quiz')).length;

      const excelData = await generateStudentExcel(
        [student],
        null,
        lessonCount,
        quizCount,
      );
      const filename = generateFilename(
        'student',
        student.studentName.replace(/\s+/g, '-'),
      );
      downloadExcel(excelData, filename);
    } catch (error) {
      console.error('Error exporting student Excel:', error);
      alert('Failed to export student data. Please try again.');
    } finally {
      setExportingStudent(null);
    }
  };
  return (
    <>
      <table className='shadow-lg w-full min-w-max'>
        <tbody className='font-content'>
          <tr className='text-white bg-secondary-dark-blue'>
            {headings.map((heading, index) => (
              <th
                key={heading}
                className={`py-5 px-4 font-medium text-sm whitespace-nowrap ${
                  index === 0
                    ? 'rounded-tl-lg'
                    : index === headings.length - 1
                    ? ''
                    : ''
                }`}
              >
                {heading}
              </th>
            ))}
            <th className='py-5 px-4 font-medium text-sm whitespace-nowrap rounded-tr-lg'>
              Export
            </th>
          </tr>
          {content.map((item, index) => (
            <tr
              key={index}
              className={`${
                index % 2 !== 0 ? 'bg-[rgba(17,28,78,0.5)] text-white' : ''
              }`}
            >
              {headings.map((heading, headingIndex) => (
                <td
                  key={headingIndex}
                  className={`${
                    heading === 'Pre Test Record' ||
                    heading === 'Post Test Record'
                      ? 'p-0'
                      : 'px-4 py-3'
                  } whitespace-nowrap`}
                >
                  {headingIndex === 0 ? (
                    <span className='w-full block px-4 py-3 text-center'>
                      {item.studentName}
                    </span>
                  ) : headingIndex === 1 ? (
                    <span className='w-full block px-4 py-3 text-center'>
                      {item.email}
                    </span>
                  ) : heading === 'Pre Test Record' ? (
                    item.preTestCompleted ? (
                      <div className='flex justify-center'>
                        <button
                          className='bg-primary-blue text-white w-[80%] py-2 text-sm hover:brightness-80 transition-all duration-200 cursor-pointer'
                          onClick={() => handleViewTestRecord(item, heading)}
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <span className='w-full block text-center py-2'>
                        Not completed
                      </span>
                    )
                  ) : heading === 'Post Test Record' ? (
                    item.postTestCompleted ? (
                      <div className='flex justify-center'>
                        <button
                          className='bg-primary-blue text-white w-[80%] py-2 text-sm hover:brightness-80 transition-all duration-200 cursor-pointer'
                          onClick={() => handleViewTestRecord(item, heading)}
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <span className='w-full block text-center py-2'>
                        Not completed
                      </span>
                    )
                  ) : (
                    <span className='min-w-[100px] block text-center px-4 py-3'>
                      {heading.includes('Quiz') &&
                      item[heading.replaceAll(' ', '')] === undefined
                        ? 'Incomplete'
                        : item[heading.replaceAll(' ', '')]}
                    </span>
                  )}
                </td>
              ))}
              <td className='px-4 py-3 text-center'>
                <button
                  onClick={() => handleExportStudent(item)}
                  disabled={exportingStudent === item.uuid}
                  className='bg-green-600 text-white px-3 py-1 rounded text-xs hover:brightness-90 disabled:brightness-75 disabled:cursor-not-allowed transition-all flex items-center gap-1 mx-auto'
                  title='Export student data'
                >
                  <Download className='w-3 h-3' />
                  {exportingStudent === item.uuid ? 'Exporting...' : 'Export'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {content.length === 0 && (
        <div className='w-full text-center font-content text-xl font-semibold my-5'>
          No student is currently in your class
        </div>
      )}
    </>
  );
}
