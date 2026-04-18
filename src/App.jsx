import './styles/global.css';
import { useState, useEffect, useCallback, memo } from 'react';
import Sidebar from './components/Sidebar';
import About from './pages/About';
import Lectures from './pages/LecturesIntroduction';
import LecturePage from './pages/LecturePage';
import PhysicalFitnessDataProvider from './providers/PhysicalFitnessDataProvider';
import { PhysicalFitnessTestPage } from './pages/PhysicalFitnessTestPage';
import PhysicalActivityReadinessQuestionnaire from './pages/PhysicalActivityReadinessQuestionnaire';
import NotFound from './pages/NotFound';
import QuizDashboard from './pages/QuizDashboard';
import Quiz from './pages/Quiz';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from 'react-router-dom';
import HealthCalculator from './pages/HealthCalculators/HealthCalculator';
import LectureProgressProvider from './providers/LectureProvider';
import Home from './pages/Home';
import { PhysicalFitnessTestSummary } from './pages/PhysicalFitnessTestSummary';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ChangePassword from './pages/Auth/ChangePassword';
import WorkoutZone from './pages/WorkoutZone';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import HamburgerMenu from './assets/icons/hamburger_icon.png';
import AccountVerification from './pages/Auth/AccountVerification';
import TeacherDashboard from './pages/Dashboard/TeacherDashboard';
import supabase from './client/supabase';
import BMICalculator from './pages/HealthCalculators/BMICalculator';
import BMRCalculator from './pages/HealthCalculators/BMRCalculator';
import IBWCalculator from './pages/HealthCalculators/IBWCalculator';
import BodyFatPercentageCalculator from './pages/HealthCalculators/BodyFatPercentageCalculator';
import WaterIntakeCalculator from './pages/HealthCalculators/WaterIntakeCalculator';
import HeartRateCalculator from './pages/HealthCalculators/HeartRateCalculator';
import { HealthCalculatorWrapper } from './pages/HealthCalculators/HealthCalculatorsWrapper';
import ViewClass from './pages/Dashboard/ViewClass';
import { useUserId } from './hooks/useUserId';
import Loading from './components/Loading';
import { useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';

const HamburgerMenuComponent = memo(({ showMenu, onHamburgerClick }) => {
  return (
    <div
      className={`fixed transition-transform  ease-in-out z-40 ${
        showMenu
          ? 'translate-y-0 duration-600'
          : '-translate-y-full duration-600'
      }`}
    >
      <div className="hamburger-menu pl-5 flex items-center top-0 w-screen h-20 md:h-15 bg-secondary-dark-blue mb-5 lg:hidden z-999 ">
        <img
          src={HamburgerMenu}
          className="w-10 md:w-7 pr-3 cursor-pointer"
          onClick={onHamburgerClick}
        />
        <p className="text-white text-3xl md:text-2xl font-heading">Hope Hub</p>
      </div>
    </div>
  );
});

function SidebarLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const handleHamburgerClick = useCallback(
    () => setSidebarOpen((open) => !open),
    [],
  );
  const containerRef = useRef(undefined);
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const currentScroll = containerRef.current.scrollTop;

    if (currentScroll > lastScrollY && currentScroll > 200) {
      setShowMenu(false);
    } else if (
      (currentScroll < lastScrollY && currentScroll > 400) ||
      currentScroll <= 0
    ) {
      setShowMenu(true);
    }

    setLastScrollY(currentScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/quizzes/')) {
      setSidebarOpen(false);
    }
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        setShowMenu={setShowMenu}
      />
      <div className="relative lg:pt-0 flex-1 h-[100dvh] overflow-x-hidden overflow-y-auto justify-center">
        <HamburgerMenuComponent
          showMenu={showMenu}
          onHamburgerClick={handleHamburgerClick}
        />
        <div
          className="pt-20 lg:pt-0  overflow-y-auto h-screen"
          ref={containerRef}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const PhysicalFitnessWrapper = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScrollToTop = () => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('scrollPFTContainerToTop', handleScrollToTop);

    return () => {
      window.removeEventListener('scrollPFTContainerToTop', handleScrollToTop);
    };
  }, []);

  return (
    <PhysicalFitnessDataProvider>
      <div ref={containerRef} className="h-full overflow-y-auto">
        <Outlet />
      </div>
    </PhysicalFitnessDataProvider>
  );
};

const LectureWrapper = () => {
  return (
    <LectureProgressProvider>
      <Outlet />
    </LectureProgressProvider>
  );
};

const AuthWrapper = () => {
  return <Outlet />;
};

const ProfileWrapper = () => {
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userID = useUserId();

  useEffect(() => {
    async function getType() {
      if (!userID) {
        return;
      }
      const { data, error: userTypeError } = await supabase
        .from('profile')
        .select('user_type')
        .eq('uuid', userID)
        .single();
      if (userTypeError) {
        return;
      }
      setIsTeacher(data.user_type === 'teacher');
      setIsLoading(false);
    }
    getType();
  }, [userID]);

  if (isLoading) {
    return <Loading />;
  }

  if (isTeacher) {
    return <TeacherDashboard></TeacherDashboard>;
  } else {
    return <StudentDashboard />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" closeButton />
      <Routes>
        <Route element={<SidebarLayout />} path="/">
          <Route index element={<Home />}></Route>
          <Route path="home" element={<Home />}></Route>
          <Route path="about" element={<About />} />{' '}
          <Route path="health-calculators" element={<HealthCalculator />}>
            {' '}
          </Route>
          <Route
            path="health-calculators"
            element={<HealthCalculatorWrapper />}
          >
            <Route path="bmi" element={<BMICalculator />} />
            <Route path="bmr" element={<BMRCalculator />} />
            <Route path="ibw" element={<IBWCalculator />} />
            <Route path="waterintake" element={<WaterIntakeCalculator />} />
            <Route
              path="bodyfatpercentage"
              element={<BodyFatPercentageCalculator />}
            />
            <Route path="heartrate" element={<HeartRateCalculator />} />
          </Route>
          <Route path="lectures" element={<LectureWrapper />}>
            <Route index element={<Lectures />} />
            <Route path="lecture/:lessonNumber/" element={<LecturePage />} />
          </Route>
          <Route
            path="workout-zone/:videoUrl"
            element={<WorkoutZone />}
          ></Route>
          <Route path="workout-zone/" element={<WorkoutZone />}></Route>
          <Route
            path="physical-fitness-test"
            element={<PhysicalFitnessWrapper />}
          >
            <Route
              path="parq"
              element={<PhysicalActivityReadinessQuestionnaire />}
            />
            <Route
              path="test/:testIndex"
              element={<PhysicalFitnessTestPage />}
            />
            <Route
              path="summary/:testType"
              element={<PhysicalFitnessTestSummary />}
            ></Route>
          </Route>
          <Route path="quizzes">
            <Route index element={<QuizDashboard />} />
            <Route path="quiz/:quizId" element={<Quiz />} />
          </Route>
          <Route path="dashboard" element={<ProfileWrapper />}></Route>
          <Route
            path="dashboard/view-class/:classCode"
            element={<ViewClass />}
          ></Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="auth" element={<AuthWrapper />}>
          <Route path="login" element={<Login />}></Route>
          <Route path="register" element={<Register />}></Route>
          <Route path="forgot-password" element={<ForgotPassword />}></Route>
          <Route path="change-password" element={<ChangePassword />}></Route>
          <Route
            path="account-verification"
            element={<AccountVerification />}
          ></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
