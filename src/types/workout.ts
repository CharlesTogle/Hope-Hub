export interface VideoDescription {
  howToDoIt: string;
  do: string[];
  dont: string[];
}

export interface WorkoutVideo {
  thumbnail: string;
  url: string;
  duration: string;
  title: string;
  description: VideoDescription;
  videoLink: string;
  uploadDate: string;
}

export interface Reference {
  name: string;
  link: string;
}

export interface WorkoutVideoGroup {
  heading: string;
  videos: WorkoutVideo[];
}
