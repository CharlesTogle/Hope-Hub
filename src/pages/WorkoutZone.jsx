import PageHeading from '@/components/PageHeading';
import VideoHeading from '@/components/workout-zone/VideoHeading';
import VideoList from '@/components/workout-zone/VideoList';
import VideoPlayer from '@/components/workout-zone/VideoPlayer';
import Footer from '@/components/Footer';
import {
  WarmUpVideo,
  UpperBodyVideos,
  LowerBodyVideos,
} from '@/utilities/WorkoutZoneVideos';
import {} from '@/utilities/WorkoutZoneVideos';
import { References } from '@/utilities/WorkoutZoneVideos';
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Citation from '@/components/Citations';
export default function WorkoutZone () {
  const [videoDetails, setVideoDetails] = useState({});
  const parentContainerRef = useRef();
  const navigate = useNavigate();
  const { videoUrl } = useParams();

  const combinedVideos = [
    ...WarmUpVideo,
    ...UpperBodyVideos,
    ...LowerBodyVideos,
  ];

  useEffect(() => {
    if (videoUrl) {
      const foundVideo = combinedVideos.find(video => video.url === videoUrl);
      if (foundVideo) {
        setVideoDetails(foundVideo);
      } else {
        navigate('/workout-zone', { replace: true });
      }
    } else {
      setVideoDetails({});
    }
  }, [videoUrl, navigate]);

  const handleVideoClick = video => {
    setVideoDetails(video);
    navigate(`/workout-zone/${video.url}`);
    if (parentContainerRef.current) {
      parentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      id='discover-more'
      className='parent-container overflow-y-auto'
      ref={parentContainerRef}
    >
      <PageHeading text='Workout Zone'></PageHeading>
      <div className='content-container w-full! pt-10!'>
        {Object.keys(videoDetails).length !== 0 && (
          <VideoPlayer video={videoDetails}></VideoPlayer>
        )}
        {/* Warm up */}
        <div className='relative w-full'>
          <div className='absolute left-0'>
            <VideoHeading text='Warm Up'></VideoHeading>
          </div>
          <div className='mt-20 w-9/10 mr-auto ml-auto '>
            <VideoList
              videos={WarmUpVideo}
              onVideoClick={handleVideoClick}
            ></VideoList>
          </div>
        </div>
        {/* Upper body */}
        <div className='relative w-full mt-10'>
          <div className='absolute left-0'>
            <VideoHeading text='Upper Body'></VideoHeading>
          </div>
          <div className='mt-20 w-9/10 mr-auto ml-auto '>
            <VideoList
              videos={UpperBodyVideos}
              onVideoClick={handleVideoClick}
            ></VideoList>
          </div>
        </div>
        {/* Lower Body */}
        <div className='relative w-full mt-10'>
          <div className='absolute left-0'>
            <VideoHeading text='Lower Body'></VideoHeading>
          </div>
          <div className='mt-20 w-9/10 mr-auto ml-auto '>
            <VideoList
              videos={LowerBodyVideos}
              onVideoClick={handleVideoClick}
            ></VideoList>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-10 mt-10 px-5 sm:text-xs md:text-sm w-[95%] mr-auto ml-auto '>
        <Citation citations={References} title='References' />
      </div>
      <Footer></Footer>
    </section>
  );
}
