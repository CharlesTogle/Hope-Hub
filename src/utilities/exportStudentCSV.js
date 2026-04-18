import supabase from '@/client/supabase';

/**
 * Fetches detailed PFT data for a student
 */
async function getDetailedPFTData (userId, testType) {
  const columnName =
    testType === 'pre'
      ? 'pre_physical_fitness_test'
      : 'post_physical_fitness_test';

  const { data, error } = await supabase
    .from('physical_fitness_test')
    .select(columnName)
    .eq('uuid', userId)
    .single();

  if (error || !data || !data[columnName]) {
    return null;
  }

  return data[columnName];
}

/**
 * Formats PFT test data into the required string format
 */
function formatPFTTest (testData) {
  if (!testData) {
    return 'Not completed';
  }

  const score = testData.record !== undefined ? testData.record : 'N/A';
  const classification = testData.classification || 'N/A';

  return `Score: ${score}\nClassification: ${classification}`;
}

/**
 * Formats BMI data specially
 */
function formatBMI (heightData, weightData) {
  if (!heightData || !weightData) {
    return 'Not completed';
  }

  const height = heightData.record || 'N/A';
  const weight = weightData.record || 'N/A';

  // Calculate BMI
  let bmi = 'N/A';
  let classification = 'N/A';

  if (height !== 'N/A' && weight !== 'N/A') {
    const heightInM = height / 100;
    bmi = (weight / (heightInM * heightInM)).toFixed(2);

    // Determine BMI classification
    if (bmi < 18.5) classification = 'Underweight';
    else if (bmi < 25) classification = 'Normal';
    else if (bmi < 30) classification = 'Overweight';
    else classification = 'Obese';
  }

  return `Height: ${height}cm\nWeight: ${weight}kg\nBMI: ${bmi}\nClassification: ${classification}`;
}

/**
 * Formats Step Test data (before and after)
 */
function formatStepTest (preStepData, stepData) {
  if (!preStepData || !stepData) {
    return 'Not completed';
  }

  const before =
    preStepData.record !== undefined ? `${preStepData.record} BPM` : 'N/A';
  const after =
    stepData.record !== undefined ? `${stepData.record} BPM` : 'N/A';

  return `Before: ${before}\nAfter: ${after}`;
}

/**
 * Generates CSV data for students with detailed PFT information
 */
export async function generateStudentCSV (
  students,
  classCode,
  lessonCount = null,
  quizCount = null,
) {
  if (students.length === 0) {
    return '';
  }

  // Determine lesson and quiz keys
  let lessonKeys = [];
  let quizKeys = [];

  if (lessonCount !== null && quizCount !== null) {
    // Use provided counts (from table headings or quiz table)
    lessonKeys = Array.from(
      { length: lessonCount },
      (_, i) => `Lesson${i + 1}`,
    );
    quizKeys = Array.from({ length: quizCount }, (_, i) => `Quiz${i + 1}`);
  } else {
    // Fallback: determine from first student data
    const sampleStudent = students[0];

    lessonKeys = Object.keys(sampleStudent).filter(key =>
      key.startsWith('Lesson'),
    );
    quizKeys = Object.keys(sampleStudent).filter(key => key.startsWith('Quiz'));

    // Sort to ensure correct order
    lessonKeys.sort((a, b) => {
      const numA = parseInt(a.replace('Lesson', ''));
      const numB = parseInt(b.replace('Lesson', ''));
      return numA - numB;
    });

    quizKeys.sort((a, b) => {
      const numA = parseInt(a.replace('Quiz', ''));
      const numB = parseInt(b.replace('Quiz', ''));
      return numA - numB;
    });
  }

  // CSV Headers
  const headers = [
    'Name',
    'Email',
    'Lecture Progress',
    ...quizKeys.map(key => {
      const num = key.replace('Quiz', '');
      return `Quiz ${num}`;
    }),
    'Pre-Test: BMI',
    'Pre-Test: 3 Min Step Test',
    'Pre-Test: Push Up',
    'Pre-Test: Basic Plank',
    'Pre-Test: Zipper Test (Right)',
    'Pre-Test: Zipper Test (Left)',
    'Pre-Test: Sit and Reach (1st)',
    'Pre-Test: Sit and Reach (2nd)',
    'Post-Test: BMI',
    'Post-Test: 3 Min Step Test',
    'Post-Test: Push Up',
    'Post-Test: Basic Plank',
    'Post-Test: Zipper Test (Right)',
    'Post-Test: Zipper Test (Left)',
    'Post-Test: Sit and Reach (1st)',
    'Post-Test: Sit and Reach (2nd)',
  ];

  // Add class code as first line if provided
  let csvContent = classCode ? `Class Code: ${classCode}\n\n` : '';
  csvContent += headers.join(',') + '\n';

  // Process each student
  for (const student of students) {
    const row = [];

    // Basic info
    row.push(`"${student.studentName || 'N/A'}"`);
    row.push(`"${student.email || 'N/A'}"`);

    // Lecture progress (count completed/total) - dynamic
    const lectureStatuses = lessonKeys
      .map(key => student[key])
      .filter(l => l !== undefined);

    const completed = lectureStatuses.filter(l => l === 'Done').length;
    const total = lectureStatuses.length;
    // Use ="value" format to prevent Excel from converting to date
    row.push(`"=""${completed}/${total}"""`);

    // Quiz scores - dynamic
    quizKeys.forEach(quizKey => {
      const quizValue = student[quizKey];
      if (quizValue === undefined) {
        row.push('"Incomplete"');
      } else {
        // Use ="value" format to prevent Excel from converting to date
        row.push(`"=""${quizValue}"""`);
      }
    });

    // Fetch Pre-Test PFT Data
    const preTestData = student.preTestCompleted
      ? await getDetailedPFTData(student.uuid, 'pre')
      : null;

    if (preTestData) {
      // Pre-Test: BMI
      row.push(`"${formatBMI(preTestData.bmiHeight, preTestData.bmiWeight)}"`);
      // Pre-Test: Step Test
      row.push(
        `"${formatStepTest(preTestData.preStepTest, preTestData.stepTest)}"`,
      );
      // Pre-Test: Push Up
      row.push(`"${formatPFTTest(preTestData.pushUp)}"`);
      // Pre-Test: Basic Plank
      row.push(`"${formatPFTTest(preTestData.basicPlank)}"`);
      // Pre-Test: Zipper Test (Right)
      row.push(`"${formatPFTTest(preTestData.zipperTestRight)}"`);
      // Pre-Test: Zipper Test (Left)
      row.push(`"${formatPFTTest(preTestData.zipperTestLeft)}"`);
      // Pre-Test: Sit and Reach (1st)
      row.push(`"${formatPFTTest(preTestData.sitAndReachFirst)}"`);
      // Pre-Test: Sit and Reach (2nd)
      row.push(`"${formatPFTTest(preTestData.sitAndReachSecond)}"`);
    } else {
      // Add "Not completed" for all pre-test columns
      for (let i = 0; i < 8; i++) {
        row.push('"Not completed"');
      }
    }

    // Fetch Post-Test PFT Data
    const postTestData = student.postTestCompleted
      ? await getDetailedPFTData(student.uuid, 'post')
      : null;

    if (postTestData) {
      // Post-Test: BMI
      row.push(
        `"${formatBMI(postTestData.bmiHeight, postTestData.bmiWeight)}"`,
      );
      // Post-Test: Step Test
      row.push(
        `"${formatStepTest(postTestData.preStepTest, postTestData.stepTest)}"`,
      );
      // Post-Test: Push Up
      row.push(`"${formatPFTTest(postTestData.pushUp)}"`);
      // Post-Test: Basic Plank
      row.push(`"${formatPFTTest(postTestData.basicPlank)}"`);
      // Post-Test: Zipper Test (Right)
      row.push(`"${formatPFTTest(postTestData.zipperTestRight)}"`);
      // Post-Test: Zipper Test (Left)
      row.push(`"${formatPFTTest(postTestData.zipperTestLeft)}"`);
      // Post-Test: Sit and Reach (1st)
      row.push(`"${formatPFTTest(postTestData.sitAndReachFirst)}"`);
      // Post-Test: Sit and Reach (2nd)
      row.push(`"${formatPFTTest(postTestData.sitAndReachSecond)}"`);
    } else {
      // Add "Not completed" for all post-test columns
      for (let i = 0; i < 8; i++) {
        row.push('"Not completed"');
      }
    }

    csvContent += row.join(',') + '\n';
  }

  return csvContent;
}

/**
 * Downloads CSV file
 */
export function downloadCSV (csvContent, filename) {
  // Add UTF-8 BOM for better Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generates filename with current date
 */
export function generateFilename (type, identifier) {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-${identifier}-${date}.csv`;
}
