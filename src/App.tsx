import './styles/global.css';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Sidebar from './components/Sidebar';
import About from './pages/About';
import Lectures from './pages/LecturesIntroduction';
import LecturePage from './pages/LecturePage';
import { PhysicalFitnessTestPage } from './pages/PhysicalFitnessTestPage';
import PhysicalActivityReadinessQuestionnaire from './pages/PhysicalActivityReadinessQuestionnaire';
import NotFound from './pages/NotFound';
import QuizDashboard from './pages/QuizDashboard';
import Quiz from './pages/Quiz';
import HealthCalculator from './pages/HealthCalculators/HealthCalculator';
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
import BMICalculator from './pages/HealthCalculators/BMICalculator';
import BMRCalculator from './pages/HealthCalculators/BMRCalculator';
import IBWCalculator from './pages/HealthCalculators/IBWCalculator';
import BodyFatPercentageCalculator from './pages/HealthCalculators/BodyFatPercentageCalculator';
import WaterIntakeCalculator from './pages/HealthCalculators/WaterIntakeCalculator';
import HeartRateCalculator from './pages/HealthCalculators/HeartRateCalculator';
import { HealthCalculatorWrapper } from './pages/HealthCalculators/HealthCalculatorsWrapper';
import ViewClass from './pages/Dashboard/ViewClass';
import Loading from './components/Loading';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import supabase from '@/client/supabase';
import { authKeys } from '@/lib/query-keys';
import { fetchAuthenticatedProfile } from '@/queries/auth-queries';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';

interface HamburgerMenuProps {
  showMenu: boolean;
  onHamburgerClick: () => void;
}

const HamburgerMenuComponent = memo(function HamburgerMenuComponent({
  showMenu,
  onHamburgerClick,
}: HamburgerMenuProps) {
  return (
    <div
      className={`fixed transition-transform ease-in-out z-40 ${
        showMenu ? 'translate-y-0 duration-600' : '-translate-y-full duration-600'
      }`}
    >
      <div className="hamburger-menu pl-5 flex items-center top-0 w-screen h-20 md:h-15 bg-secondary-dark-blue mb-5 lg:hidden z-999">
        <img
          src={HamburgerMenu}
          className="w-10 md:w-7 pr-3 cursor-pointer"
          onClick={onHamburgerClick}
          alt="Menu"
        />
        <p className="text-white text-3xl md:text-2xl font-heading">Hope Hub</p>
      </div>
    </div>
  );
});

function ProtectedRoute() {
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <Loading />;
  }

  if (!profile) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

function TeacherRoute() {
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <Loading />;
  }

  if (!profile) {
    return <Navigate to="/auth/login" replace />;
  }

  if (profile.user_type !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function SidebarLayout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const showMenu = useUIStore((state) => state.showMenu);
  const setShowMenu = useUIStore((state) => state.setShowMenu);
  const lastScrollY = useUIStore((state) => state.lastScrollY);
  const setLastScrollY = useUIStore((state) => state.setLastScrollY);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const handleHamburgerClick = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

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
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (location.pathname.includes('/quizzes/')) {
      setSidebarOpen(false);
    }
  }, [location.pathname, setSidebarOpen]);

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
          className="pt-20 lg:pt-0 overflow-y-auto h-screen"
          ref={containerRef}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function AuthSessionBridge() {
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const queryClient = useQueryClient();

  const { data: authSession } = useQuery({
    queryKey: authKeys.current(),
    queryFn: fetchAuthenticatedProfile,
  });

  useEffect(() => {
    if (!authSession) {
      return;
    }

    setAuthState(authSession);
  }, [authSession, setAuthState]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}

function PhysicalFitnessWrapper() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScrollToTop = () => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scrollPFTContainerToTop', handleScrollToTop);
    return () => window.removeEventListener('scrollPFTContainerToTop', handleScrollToTop);
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <Outlet />
    </div>
  );
}

function AuthWrapper() {
  return <Outlet />;
}

function ProfileWrapper() {
  const profile = useAuthStore((state) => state.profile);

  if (profile?.user_type === 'teacher') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthSessionBridge />
      <Toaster position="top-right" closeButton />
      <Routes>
        <Route element={<ErrorBoundary><SidebarLayout /></ErrorBoundary>} path="/">
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="about" element={<About />} />
          <Route
            path="health-calculators"
            element={<HealthCalculatorWrapper />}
          >
            <Route index element={<HealthCalculator />} />
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
          <Route element={<ProtectedRoute />}>
            <Route path="lectures">
              <Route index element={<Lectures />} />
              <Route path="lecture/:lessonNumber/" element={<LecturePage />} />
            </Route>
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
              />
            </Route>
            <Route path="quizzes">
              <Route index element={<QuizDashboard />} />
              <Route path="quiz/:quizId" element={<Quiz />} />
            </Route>
            <Route path="dashboard" element={<ProfileWrapper />} />
            <Route element={<TeacherRoute />}>
              <Route
                path="dashboard/view-class/:classCode"
                element={<ViewClass />}
              />
              <Route
                path="dashboard/view-class/:classCode/physical-fitness-test/summary/:testType/:studentId"
                element={<PhysicalFitnessTestSummary />}
              />
            </Route>
          </Route>
          <Route path="workout-zone/:videoUrl" element={<WorkoutZone />} />
          <Route path="workout-zone/" element={<WorkoutZone />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="auth" element={<ErrorBoundary><AuthWrapper /></ErrorBoundary>}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route
            path="account-verification"
            element={<AccountVerification />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
