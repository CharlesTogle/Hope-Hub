export default function GenderSelector ({ gender, setGender }) {
  return (
    <div className='flex flex-col justify-between w-full font-content md:flex-row'>
      <p className='text-xs md:text-base pb-2 sm:pb-0'>Gender</p>
      <div className='w-full flex justify-around align-middle text-xs md:text-base'>
        <label className='text-xs md:text-base'>
          <input
            type='radio'
            name='gender'
            value='male'
            checked={gender === 'male'}
            onChange={e => setGender(e.target.value)}
            className='scale-150 border-2 border-black mr-3'
          />
          Male
        </label>
        <label className='text-xs md:text-base'>
          <input
            type='radio'
            name='gender'
            value='female'
            checked={gender === 'female'}
            onChange={e => setGender(e.target.value)}
            className='scale-150 border-2 border-black mr-3'
          />
          Female
        </label>
      </div>
    </div>
  );
}
