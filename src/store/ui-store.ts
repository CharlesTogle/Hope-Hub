import { create } from 'zustand';

type ViewClassFilter = 'All' | 'Lecture' | 'Quiz';
type LectureSubFilter = 'all' | 'done' | 'pending' | 'incomplete';
type QuizSubFilter = 'none' | 'ascending' | 'descending';

interface StudentDashboardUIState {
  tempClassCode: string;
  isJoiningClass: boolean;
  confirmingLeave: boolean;
}

interface TeacherDashboardUIState {
  showAddClassModal: boolean;
  confirmingRemoveClassCode: string | null;
}

interface ViewClassUIState {
  activeFilter: ViewClassFilter;
  lectureSubFilter: LectureSubFilter;
  quizSubFilter: QuizSubFilter;
  searchTerm: string;
  isExporting: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  showMenu: boolean;
  lastScrollY: number;
  activeModal: string | null;
  studentDashboard: StudentDashboardUIState;
  teacherDashboard: TeacherDashboardUIState;
  viewClass: ViewClassUIState;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setShowMenu: (show: boolean) => void;
  setLastScrollY: (value: number) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setStudentTempClassCode: (value: string) => void;
  setStudentJoinClassOpen: (open: boolean) => void;
  setStudentConfirmingLeave: (value: boolean) => void;
  resetStudentDashboard: () => void;
  setTeacherAddClassModalOpen: (open: boolean) => void;
  setTeacherConfirmingRemoveClassCode: (value: string | null) => void;
  resetTeacherDashboard: () => void;
  setViewClassFilter: (value: ViewClassFilter) => void;
  setViewClassLectureSubFilter: (value: LectureSubFilter) => void;
  setViewClassQuizSubFilter: (value: QuizSubFilter) => void;
  setViewClassSearchTerm: (value: string) => void;
  setViewClassIsExporting: (value: boolean) => void;
  resetViewClass: () => void;
}

const initialStudentDashboard: StudentDashboardUIState = {
  tempClassCode: '',
  isJoiningClass: false,
  confirmingLeave: false,
};

const initialTeacherDashboard: TeacherDashboardUIState = {
  showAddClassModal: false,
  confirmingRemoveClassCode: null,
};

const initialViewClass: ViewClassUIState = {
  activeFilter: 'All',
  lectureSubFilter: 'all',
  quizSubFilter: 'none',
  searchTerm: '',
  isExporting: false,
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  showMenu: true,
  lastScrollY: 0,
  activeModal: null,
  studentDashboard: initialStudentDashboard,
  teacherDashboard: initialTeacherDashboard,
  viewClass: initialViewClass,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setShowMenu: (show) => set({ showMenu: show }),
  setLastScrollY: (value) => set({ lastScrollY: value }),
  openModal: (id: string) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setStudentTempClassCode: (value) =>
    set((state) => ({
      studentDashboard: { ...state.studentDashboard, tempClassCode: value },
    })),
  setStudentJoinClassOpen: (open) =>
    set((state) => ({
      studentDashboard: { ...state.studentDashboard, isJoiningClass: open },
    })),
  setStudentConfirmingLeave: (value) =>
    set((state) => ({
      studentDashboard: { ...state.studentDashboard, confirmingLeave: value },
    })),
  resetStudentDashboard: () => set({ studentDashboard: initialStudentDashboard }),
  setTeacherAddClassModalOpen: (open) =>
    set((state) => ({
      teacherDashboard: { ...state.teacherDashboard, showAddClassModal: open },
    })),
  setTeacherConfirmingRemoveClassCode: (value) =>
    set((state) => ({
      teacherDashboard: {
        ...state.teacherDashboard,
        confirmingRemoveClassCode: value,
      },
    })),
  resetTeacherDashboard: () => set({ teacherDashboard: initialTeacherDashboard }),
  setViewClassFilter: (value) =>
    set((state) => ({
      viewClass: { ...state.viewClass, activeFilter: value },
    })),
  setViewClassLectureSubFilter: (value) =>
    set((state) => ({
      viewClass: { ...state.viewClass, lectureSubFilter: value },
    })),
  setViewClassQuizSubFilter: (value) =>
    set((state) => ({
      viewClass: { ...state.viewClass, quizSubFilter: value },
    })),
  setViewClassSearchTerm: (value) =>
    set((state) => ({
      viewClass: { ...state.viewClass, searchTerm: value },
    })),
  setViewClassIsExporting: (value) =>
    set((state) => ({
      viewClass: { ...state.viewClass, isExporting: value },
    })),
  resetViewClass: () => set({ viewClass: initialViewClass }),
}));
