import { Lessons } from './Lessons';

const LectureProgress = () => {
  let lectureProgress = [];

  Lessons.forEach((item) => {
    lectureProgress.push({
      title: item.title,
      key: item.key,
      status: 'Incomplete',
    });
  });

  return lectureProgress;
};

export default LectureProgress;
