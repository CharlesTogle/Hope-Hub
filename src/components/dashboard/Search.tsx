import SearchIcon from '@/assets/icons/search_icon.png';

interface SearchProps {
  value?: string;
  onSearch?: (value: string) => void;
  placeholder?: string;
}

export default function Search({
  value,
  onSearch,
  placeholder = 'Search Student Name',
}: SearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <>
      <input
        type='text'
        value={value}
        placeholder={placeholder}
        className='py-2 rounded-lg border-1 w-full lg:py-0 border-black lg:h-1/2 pl-3'
        onChange={handleInputChange}
      />
      <div className='hidden lg:flex flex-row lg:h-1/3 '>
        <img src={SearchIcon} alt='search' />
        <p>Search</p>
      </div>
    </>
  );
}
