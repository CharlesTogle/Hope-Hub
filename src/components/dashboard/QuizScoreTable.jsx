import { useEffect, useState } from 'react';
import Container from './Container';
export default function QuizScoreTable({ quizData, quizCount }) {
  const [sortedQuizData, setSortedQuizData] = useState([]);
  useEffect(() => {
    if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
      setSortedQuizData([]);
      return;
    }

    const sortedQuizData = [...quizData].sort((a, b) => {
      return a.quiz_id - b.quiz_id;
    });
    setSortedQuizData(sortedQuizData);
  }, [quizData]);

  return (
    <Container className="p-0! mb-3">
      <table className="w-full font-content overflow-hidden">
        <tbody>
          <tr className="bg-neutral-dark-blue text-white h-15 w-full text-sm md:text-base lg:text-base">
            <th className="w-1/3">Quiz No.</th>
            <th className="w-1/3">Date Taken</th>
            <th className="w-1/3">Score</th>
          </tr>
          {sortedQuizData.map((data, index) => (
            <tr
              key={data.quiz_id || index}
              className="font-semibold h-10 text-xs lg:text-base md:text-base"
            >
              <td>
                {data.quiz_id === 4 ? `Quiz PFT` : `Quiz No.${data.quiz_id}`}
              </td>
              <td
                className={
                  data.status === 'Pending'
                    ? 'text-primary-yellow'
                    : data.status === 'Incomplete'
                    ? 'text-red'
                    : ''
                }
              >
                {data.status === 'Done'
                  ? new Date(data.date_taken).toLocaleDateString('en-us', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : data.status}
              </td>
              <td className="text-neutral-dark-blue">
                {data.status === 'Done'
                  ? `${data.score}/${data.total_items}`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}
