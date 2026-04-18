import VideoPreview from './VideoPreview';

export default function VideoList ({ videos, onVideoClick }) {
  return (
    <div className='flex overflow-x-auto lg:grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-5 mx-auto'>
      {Array.isArray(videos) &&
        videos.map(video => {
          const videoDetails = video;
          return (
            <div
              onClick={() => onVideoClick(videoDetails)}
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
