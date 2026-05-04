import PageHeading from '@/components/PageHeading';
import VideoHeading from '@/components/workout-zone/VideoHeading';
import VideoList from '@/components/workout-zone/VideoList';
import VideoPlayer from '@/components/workout-zone/VideoPlayer';
import Footer from '@/components/Footer';
import { WarmUpVideo, UpperBodyVideos, LowerBodyVideos, References } from '@/utilities/WorkoutZoneVideos';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Citation from '@/components/Citations';
import type { WorkoutVideo } from '@/types/workout';

const combinedVideos = [...WarmUpVideo, ...UpperBodyVideos, ...LowerBodyVideos];

export default function WorkoutZone() {
  const parentContainerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { videoUrl } = useParams<{ videoUrl: string }>();

  // Compute inline — no useEffect, no derived state
  const videoDetails = videoUrl
    ? combinedVideos.find((video) => video.url === videoUrl) ?? null
    : null;

  const handleVideoClick = (video: WorkoutVideo) => {
    navigate(`/workout-zone/${video.url}`);
    if (parentContainerRef.current) {
      parentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="discover-more" className="parent-container overflow-y-auto" ref={parentContainerRef}>
      <PageHeading text="Workout Zone" />
      <div className="content-container w-full! pt-10!">
        {videoDetails && <VideoPlayer video={videoDetails} />}
        <div className="relative w-full">
          <div className="absolute left-0">
            <VideoHeading text="Warm Up" />
          </div>
          <div className="mt-20 w-9/10 mr-auto ml-auto">
            <VideoList videos={WarmUpVideo} onVideoClick={handleVideoClick} />
          </div>
        </div>
        <div className="relative w-full mt-10">
          <div className="absolute left-0">
            <VideoHeading text="Upper Body" />
          </div>
          <div className="mt-20 w-9/10 mr-auto ml-auto">
            <VideoList videos={UpperBodyVideos} onVideoClick={handleVideoClick} />
          </div>
        </div>
        <div className="relative w-full mt-10">
          <div className="absolute left-0">
            <VideoHeading text="Lower Body" />
          </div>
          <div className="mt-20 w-9/10 mr-auto ml-auto">
            <VideoList videos={LowerBodyVideos} onVideoClick={handleVideoClick} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-10 mt-10 px-5 sm:text-xs md:text-sm w-[95%] mr-auto ml-auto">
        <Citation citations={References} title="References" />
      </div>
      <Footer />
    </section>
  );
}
