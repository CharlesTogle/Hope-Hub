export const cleanStudentData = studentData => {
  const cleanedData = [];
  studentData.forEach(data => {
    const clean = {
      email: data.email,
      studentName: data.full_name,
      uuid: data.uuid,
      preTestCompleted: false,
      postTestCompleted: false,
    };

    const { lecture_progress } = data;
    lecture_progress[0].forEach(lecture => {
      clean[`Lesson${lecture.key}`] = lecture.status;
    });

    const preTest = data.pre_physical_fitness_test;
    const postTest = data.post_physical_fitness_test;
    if (preTest && preTest[0]) {
      const { finishedTestIndex } = preTest[0];
      if (finishedTestIndex) {
        clean.preTestCompleted =
          finishedTestIndex &&
          finishedTestIndex.includes(finishedTestIndex.length - 1);
      }
    }

    if (postTest && postTest[0]) {
      const { finishedTestIndex } = postTest[0];
      if (finishedTestIndex) {
        clean.postTestCompleted =
          finishedTestIndex &&
          finishedTestIndex.includes(finishedTestIndex.length - 1);
      }
    }

    const quizData = data.quiz_data;
    if (quizData) {
      quizData.forEach(quiz => {
        clean[`Quiz${quiz.quiz_number}`] =
          quiz.status === 'Pending'
            ? quiz.status
            : `${quiz.score}/${quiz.total_items}`;
      });
    }

    cleanedData.push(clean);
  });

  return cleanedData.sort((a, b) => a.studentName.localeCompare(b.studentName));
};
