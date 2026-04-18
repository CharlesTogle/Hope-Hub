export default function VideoPlayer ({ video }) {
  return (
    <>
      <div id='video-player' className='w-full lg:w-7/10'>
        <div className='lg:w-full lg:min-h-100 max-h-fit'>
          <iframe
            width='560'
            height='315'
            src={video.videoLink}
            title='YouTube video player'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            referrerPolicy='strict-origin-when-cross-origin'
            allowFullScreen
            className={`rounded-lg px-2 w-full lg:w-full lg:min-h-150`}
          ></iframe>
        </div>
        <div id='video-details' className={`mt-5 mb-20 px-3`}>
          <h2 className='text-3xl font-content text-primary-blue font-medium'>
            {video.title}
          </h2>
          <hr className='w-1/3 border-1 border-primary-yellow mt-2 mb-4' />
          <div className='mb-3'>
            <p className='text-lg font-medium'>How to do it</p>
            {video.description.howToDoIt}
          </div>
          {video.description.do && video.description.do.length > 0 && (
            <div>
              <p className='font-semibold text-green-600 mb-2'>Do's</p>
              <ul className='mb-4'>
                {video.description.do.map((doItem, index) => (
                  <li key={index} className='flex items-start mb-1'>
                    <span className='text-green-600 mr-2'>✓</span>
                    {doItem}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {video.description.dont && video.description.dont.length > 0 && (
            <div>
              <p className='font-semibold text-red-600 lg:mb-2'>Don'ts</p>
              <ul className='lg:mb-4'>
                {video.description.dont.map((dontItem, index) => (
                  <li key={index} className='flex items-start mb-1'>
                    <span className='text-red-600 mr-2'>✗</span>
                    {dontItem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <hr className='w-full border-1 border-black mb-10' />
    </>
  );
}
