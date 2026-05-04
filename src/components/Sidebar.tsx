import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarLogo from '@/assets/logos/hopehub_logo_v1.png';
import SidebarLogoSmall from '@/assets/logos/logo_small_sidebar.png';
import HomeIcon from '@/assets/icons/home_sidebar.png';
import CalculatorIcon from '@/assets/icons/calculator_sidebar.png';
import LecturesIcon from '@/assets/icons/lecture_sidebar.png';
import QuizIcon from '@/assets/icons/quiz_sidebar.png';
import DiscoverIcon from '@/assets/icons/discover-more_sidebar.png';
import PhysicalFitnessIcon from '@/assets/icons/physicalFitnessTest_sidebar.png';
import AboutIcon from '@/assets/icons/about_sidebar.png';
import ProfileIcon from '@/assets/icons/profile_sidebar.png';
import ActiveHomeIcon from '@/assets/icons/activeIcons/ActiveHomeIcon.png';
import ActiveCalculatorIcon from '@/assets/icons/activeIcons/ActiveCalculatorsIcon.png';
import ActiveLecturesIcon from '@/assets/icons/activeIcons/ActiveLecturesIcon.png';
import ActiveQuizIcon from '@/assets/icons/activeIcons/ActiveQuizIcon.png';
import ActivePhysicalFitnessIcon from '@/assets/icons/activeIcons/ActivePhysicalIcon.png';
import ActiveDiscoverIcon from '@/assets/icons/activeIcons/ActiveDiscoverIcon.png';
import ActiveAboutIcon from '@/assets/icons/activeIcons/ActiveAboutIcon.png';
import ActiveProfileIcon from '@/assets/icons/activeIcons/ActiveProfileIcon.png';
import { useMobile } from '@/hooks/useMobile';
import '@/styles/sidebar.css';

interface SidebarButton {
  text:
    | 'Home'
    | 'Health Calculators'
    | 'Lectures'
    | 'Quizzes'
    | 'Physical Fitness Test'
    | 'Workout Zone'
    | 'About'
    | 'Dashboard';
  icon: string;
  route: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  setShowMenu: (value: boolean) => void;
}

const sidebarButtons: SidebarButton[] = [
  { text: 'Home', icon: HomeIcon, route: '/home' },
  {
    text: 'Health Calculators',
    icon: CalculatorIcon,
    route: '/health-calculators',
  },
  { text: 'Lectures', icon: LecturesIcon, route: '/lectures' },
  { text: 'Quizzes', icon: QuizIcon, route: '/quizzes' },
  {
    text: 'Physical Fitness Test',
    icon: PhysicalFitnessIcon,
    route: '/physical-fitness-test/parq',
  },
  { text: 'Workout Zone', icon: DiscoverIcon, route: '/workout-zone' },
  { text: 'About', icon: AboutIcon, route: '/about' },
  { text: 'Dashboard', icon: ProfileIcon, route: '/dashboard' },
];

const activeIconVariants: Record<SidebarButton['text'], string> = {
  Home: ActiveHomeIcon,
  'Health Calculators': ActiveCalculatorIcon,
  Lectures: ActiveLecturesIcon,
  Quizzes: ActiveQuizIcon,
  'Physical Fitness Test': ActivePhysicalFitnessIcon,
  'Workout Zone': ActiveDiscoverIcon,
  About: ActiveAboutIcon,
  Dashboard: ActiveProfileIcon,
};

export default function Sidebar({
  isOpen,
  onClose,
  setShowMenu,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile(1024);
  const [isWide, setIsWide] = useState(false);

  const active = sidebarButtons.findIndex((button) =>
    button.route === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(button.route.replace(/\/$/, '')),
  );

  useEffect(() => {
    if (!isMobile || !isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const target = event.target;

      if (sidebar && target instanceof Node && !sidebar.contains(target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobile, isOpen, onClose]);

  const handleClick = useCallback(
    (route: string) => {
      setShowMenu(true);
      navigate(route);

      if (isMobile) {
        onClose?.();
      }
    },
    [isMobile, navigate, onClose, setShowMenu],
  );

  return (
    <aside
      id="sidebar"
      className={`${
        isMobile ? '' : 'aside '
      } lg:w-[7vw] w-[60vw] md:w-[30vw] h-screen overflow-hidden bg-secondary-dark-blue lg:relative
      border-r-secondary-dark-blue lg:flex flex-col items-center absolute z-999
      transition-all duration-400
      ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full w-0!') : ''}`}
      onMouseEnter={() => setIsWide(true)}
      onMouseLeave={() => setIsWide(false)}
    >
      <div
        id="logo"
        className={`fulltransition-all w-full duration-400 ease-out flex justify-center items-center mb-4 md:mb-0 lg:mb-0 ${
          isWide || (isMobile && isOpen) ? 'bg-white' : ''
        }`}
        onClick={() => navigate('/home')}
      >
        {!isWide && <hr className="mt-5 absolute top-0 w-[60%] right-0" />}
        <img
          src={isWide || (isMobile && isOpen) ? SidebarLogo : SidebarLogoSmall}
          alt="Hope Hub"
          className="transition-all duration-400 w-fit h-[15dvh] mt-[3vh] mb-[3vh] lg:mt-0 lg:h-40 object-contain"
        />
      </div>

      <div
        id="sidebar-button"
        className="flex flex-col items-center gap-3 mt-3 md:mt-0 md:justify-evenly md:gap-0 w-full h-[75dvh] lg:h-full"
      >
        {sidebarButtons.map((item, index) => (
          <div className="w-full bg-secondary-dark-blue pt-2 pb-2" key={item.text}>
            <button
              type="button"
              onClick={() => handleClick(item.route)}
              className="transition-all duration-500 flex items-center w-full relative"
            >
              <div
                className={`highlight opacity-0 ${
                  index === active ? 'block opacity-30 ' : ''
                } absolute w-full bg-black z-0 pb-6 pt-6`}
              />
              <img
                src={index === active ? activeIconVariants[item.text] : item.icon}
                className="relative z-1 transition-all duration-500 ml-5 lg:ml-0 mr-5 w-6 md:w-3 lg:w-[unset] lg:h-7"
                alt={`${item.text} Icon`}
              />
              <p className="relative z-1 text-base md:text-xs text-text-content text-wrap font-heading text-left border-white lg:w-[60%] lg:text-base">
                {item.text}
              </p>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
