import VideoPreview from './VideoPreview';
import type { WorkoutVideo } from '@/types/workout';

interface VideoListProps {
  videos: WorkoutVideo[];
  onVideoClick: (video: WorkoutVideo) => void;
}

export default function VideoList({ videos, onVideoClick }: VideoListProps) {
  return (
    <div className='flex overflow-x-auto lg:grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-5 mx-auto'>
      {Array.isArray(videos) &&
        videos.map((video) => {
          return (
            <div
              onClick={() => onVideoClick(video)}
              className='cursor-pointer'
              key={video.url}
            >
              <VideoPreview
                duration={video.duration}
                thumbnail={video.thumbnail}
                title={video.title}
                uploadDate={video.uploadDate}
                key={video.title}
              />
            </div>
          );
        })}
    </div>
  );
}
