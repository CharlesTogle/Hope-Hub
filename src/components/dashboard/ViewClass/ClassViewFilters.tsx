import Search from '@/components/dashboard/Search';
import {
  lectureSubFilterOptions,
  quizSubFilterOptions,
  type FilterValue,
  type LectureSubFilterValue,
  type QuizSubFilterValue,
} from '@/lib/view-class';

interface ClassViewFiltersProps {
  activeFilter: FilterValue;
  lectureSubFilter: LectureSubFilterValue;
  quizSubFilter: QuizSubFilterValue;
  searchTerm: string;
  onFilterChange: (filter: FilterValue) => void;
  onLectureSubFilterChange: (value: LectureSubFilterValue) => void;
  onQuizSubFilterChange: (value: QuizSubFilterValue) => void;
  onSearchTermChange: (value: string) => void;
  filters: ReadonlyArray<FilterValue>;
}

export default function ClassViewFilters({
  activeFilter,
  lectureSubFilter,
  quizSubFilter,
  searchTerm,
  onFilterChange,
  onLectureSubFilterChange,
  onQuizSubFilterChange,
  onSearchTermChange,
  filters,
}: ClassViewFiltersProps) {
  return (
    <div
      className="self-start mt-5 flex w-full justify-between flex-col lg:flex-row gap-4"
      id="options"
    >
      <div className="flex flex-col gap-3">
        <div
          id="buttons"
          className="rounded-sm bg-secondary-dark-blue w-fit h-fit flex items-center flex-nowrap lg:w-fit"
        >
          {filters.map((filter, index) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={
                `text-white text-center font-content py-2 min-w-1/8 px-5 text-sm lg:w-auto lg:px-5 transition-colors sticky top-0 ${
                  index === 0 ? 'rounded-l-sm' : ''
                } ${index === filters.length - 1 ? 'rounded-r-sm' : ''} ` +
                (filter === activeFilter
                  ? 'bg-primary-yellow text-secondary-dark-blue'
                  : 'bg-secondary-dark-blue hover:bg-gray-700')
              }
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="h-10 flex items-center">
          {activeFilter === 'Lecture' && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-sm font-content text-gray-600">Status:</span>
              <div className="flex bg-gray-100 rounded-md p-1">
                {lectureSubFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onLectureSubFilterChange(option.value)}
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
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-sm font-content text-gray-600">
                Sort by score:
              </span>
              <div className="flex bg-gray-100 rounded-md p-1">
                {quizSubFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onQuizSubFilterChange(option.value)}
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
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-sm font-content text-gray-500 italic">
                Showing all content
              </span>
            </div>
          )}
        </div>
      </div>
      <div id="search" className="w-full lg:w-[40%] flex items-center gap-3">
        <Search value={searchTerm} onSearch={onSearchTermChange} />
      </div>
    </div>
  );
}
