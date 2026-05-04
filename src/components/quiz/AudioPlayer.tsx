import { useRef, useState, type ReactNode } from 'react';

interface AudioPlayerProps {
  source: string;
  shouldStop: boolean;
  children: ReactNode;
}

export default function AudioPlayer({
  source,
  shouldStop,
  children,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = () => {
    const audio = audioRef.current;
    if (audio) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
        });
    }
  };

  if (shouldStop && isPlaying) {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0; // Reset to the beginning
      setIsPlaying(false);
    }
  }

  return (
    <div onClick={handleClick}>
      <audio ref={audioRef} loop>
        <source src={source} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {children}
    </div>
  );
}
