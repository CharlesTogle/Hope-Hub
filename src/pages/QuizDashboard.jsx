import PageHeading from '@/components/PageHeading';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizzes, extractQuizDetails } from '@/utilities/QuizData';
import { motion, AnimatePresence } from 'motion/react';
import Loading from '@/components/Loading';
import Footer from '@/components/Footer';
import { useUserId } from '@/hooks/useUserId';
import { toast } from 'sonner';
import { getCurrentUser } from '@/utilities/QuizData';
import supabase from '@/client/supabase';

export default function QuizDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [userType, setUserType] = useState('student');
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Done', 'Pending', 'Locked'];

  const userId = useUserId();

  useEffect(() => {
    async function fetchAndSetQuizzes() {
      const user = await getCurrentUser();

      const userData = await supabase
        .from('profile')
        .select(
          `
      user_type
      `,
        )
        .eq('uuid', user.id)
        .single();

      const userType = userData.data.user_type;
      setUserType(userType);

      const data = await extractQuizDetails(await fetchQuizzes());
      setQuizzes(data);
      setTimeout(() => setIsLoading(false), 1000);
    }
    fetchAndSetQuizzes();
  }, []);

  return (
    <div className="h-screen overflow-y-auto">
      <PageHeading text="Quizzes" className="bg-background z-2"></PageHeading>
      {isLoading ? (
        <div className="flex justify-center items-center h-[60vh] p-4">
          <Loading />
        </div>
      ) : (
        <>
          <div
            id="header"
            className="flex flex-wrap lg:justify-between md:justify-between justify-start sticky top-0 pt-5 lg:pt-5 md:pt-0 pb-1 z-10 bg-background lg:w-full lg:px-20 md:px-20 px-7 "
          >
            <h2 className="font-heading-small text-2xl lg:text-3xl text-primary-blue border-primary-yellow border-b-3 pb-2">
              Dashboard
            </h2>{' '}
            {userType === 'student' ? (
              <ul className="flex mt-4 lg:mt-0 rounded-sm bg-secondary-dark-blue font-content text-sm lg:text-base">
                {filters.map((filter, index) => {
                  return (
                    <motion.li
                      key={index}
                      className={`${
                        filter === activeFilter
                          ? 'filter-active'
                          : 'hover:bg-gray-700'
                      }
                  ${
                    index === 0
                      ? 'rounded-l-sm'
                      : index === filters.length - 1
                      ? 'rounded-r-sm'
                      : ''
                  }
                    filter cursor-pointer py-2 w-fit`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </motion.li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <div
            id="quizzes"
            className="flex flex-col items-center justify-center w-5/6 mx-auto mb-8 relative"
          >
            <div className="flex flex-col items-center mt-4 lg:mt-8 justify-center min-h-[40vh] w-full">
              {Array.isArray(quizzes) &&
              quizzes.filter(
                (quiz) =>
                  quiz.status === activeFilter || activeFilter === 'All',
              ).length > 0 ? (
                <div className="w-full">
                  {quizzes.map((quiz) => {
                    return (
                      (quiz.status === activeFilter ||
                        activeFilter === 'All') && (
                        <Card
                          key={'Quiz ' + quiz.number}
                          quiz={quiz}
                          userType={userType}
                        />
                      )
                    );
                  })}
                </div>
              ) : (
                <p className="font-content font-bold text-2xl pt-15">
                  No Available Data
                </p>
              )}
            </div>
          </div>
        </>
      )}
      <Footer></Footer>
    </div>
  );
}

function Card({ quiz, userType }) {
  const statusColors = {
    Done: 'bg-green',
    Pending: 'bg-primary-yellow',
    Locked: 'bg-red',
  };

  const cardBody = (
    <motion.div
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.3 },
      }}
      whileTap={{
        scale: 0.97,
        transition: { duration: 0.3 },
      }}
      className="rounded-2xl flex flex-col border-2 border-primary-blue overflow-clip mb-5"
    >
      <div className="flex justify-between items-center px-5 lg:px-10  bg-secondary-dark-blue font-content text-white h-[10vh] lg:h-[8vh]">
        <h2 className="text-lg lg:text-2xl w-[60%]">
          <strong>
            {'Quiz ' + (quiz.number === 0 ? '' : quiz.number) + ': '}
          </strong>
          {quiz.title}
        </h2>
        <h3
          className={`${
            statusColors[quiz.status]
          } rounded-sm flex items-center justify-center w-[35%] lg:max-w-[15%] py-1`}
        >
          {userType === 'teacher' ? 'Demo' : quiz.status}
        </h3>
      </div>
      <div className="flex justify-between items-center py-4 pl-5 pr-2 lg:pl-10 lg:pr-15 w-full min-h-[20vh]">
        <Results
          status={userType === 'teacher' ? 'Demo' : quiz.status}
          details={quiz.details}
          lectureTitle={
            quiz.number === 0
              ? `PFT`
              : `Lecture #${quiz.number + ' ' + quiz.lecture_title}`
          }
        />
        <div className="w-[3px] min-h-[20vh] lg:min-h-[20vh] bg-primary-yellow"></div>
        <Overview content={quiz.content} />
      </div>
    </motion.div>
  );
  return quiz.status === 'Locked' ? (
    cardBody
  ) : (
    <Link
      onClick={() => {
        if (userType === 'teacher')
          toast.info('You are about to start the demo of the quiz.', {
            duration: 5000,
            className:
              '!bg-secondary-dark-blue !text-white !border-secondary-dark-blue',
          });
      }}
      to={`quiz/${quiz.number}`}
    >
      {cardBody}
    </Link>
  );
}

function Results({ status, details, lectureTitle }) {
  const resultsView = {
    Done: details
      ? Object.entries(details).map(([key, value]) => {
          return (
            <h4 key={key}>
              <strong>
                <i>{key}:</i>
              </strong>
              {' ' + value}
            </h4>
          );
        })
      : null,
    Pending: (
      <h4>
        <strong>
          <i>Not yet Done</i>
        </strong>
        <br />
        <i>(Can be taken)</i>
      </h4>
    ),
    Locked: (
      <h4>
        <strong>
          <i>LOCKED</i>
        </strong>
        <br />
        <i>(Finish the {lectureTitle} to Access)</i>
      </h4>
    ),
    Demo: (
      <h4>
        <i>(This is a demo quiz for {lectureTitle})</i>
      </h4>
    ),
  };

  return (
    <div
      className={`${
        status === 'Done' ? 'items-start' : 'items-center text-center'
      } w-[30%] lg:w-[23%] flex flex-col gap-y-1 justify-center font-content text-sm lg:text-base`}
    >
      {resultsView[status]}
    </div>
  );
}

function Overview({ content }) {
  return (
    <div className="font-content text-sm lg:text-base w-[62%]">
      <h4 className="text-primary-blue">Introduction: </h4>
      <ul className="list-disc list-outside pl-5">
        <li>{content}</li>
      </ul>
    </div>
  );
}
