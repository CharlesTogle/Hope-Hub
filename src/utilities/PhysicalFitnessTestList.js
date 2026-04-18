// Exercise cover images
export const PhysicalFitnessTestList = [
  {
    title: 'BMI (Weight)',
    key: 'bmiWeight',
    description: [
      "**Body Composition** - is the body's relative amount of fat to fat-free mass.",
      '**Weight** - the heaviness or lightness of a person.',
    ],
    equipment: ['Weighing Scale'],
    instructionsForTester: [
      'Wear light clothing before weighing.',
      'On bare feet, stand erect and still with weight evenly distributed on the center of the scale.',
    ],
    instructionsForPartner: [
      'Before the start of weighing, adjust the scale to zero point.',
      'Record the score in kilograms',
    ],
    instructionsScoring: ['Record body mass to the nearest 0.5 kilograms'],
    videoInstructions:
      'https://www.youtube.com/embed/iiyquWDuw5M?si=3k3Qkvhu1_G6A0Ot?autoplay=1',
    unit: 'kg',
  },
  {
    title: 'BMI (Height)',
    key: 'bmiHeight',
    description: [
      "**Body Composition** - is the body's relative amount of fat to fat-free mass.",
      '**Height** - the measurement of a person from head to foot.',
    ],
    equipment: [
      'Tape measure laid flat to a concrete wall where zero points starts on the floor.',
      'L-square; and',
      'An even and firm floor and flat wall.',
    ],
    instructionsForTester: [
      'Stand erect on bare feet with heels, buttocks and shoulders pressed against the wall where the tape measure is attached.',
    ],
    instructionsForPartner: [
      'Place the L-square against the wall with the base at the top of the head of the person being tested. Make sure the L-square when placed on the head of the student, is straight and parallel to the floor.',
      'Record the score in meters',
    ],
    instructionsScoring: [
      'Record standing height to the nearest 0.1 centimeter',
      '1 meter = 100 centimeter',
    ],
    videoInstructions:
      'https://www.youtube.com/embed/iiyquWDuw5M?si=3k3Qkvhu1_G6A0Ot?autoplay=1',
    unit: 'cm',
  },

  {
    title: 'Zipper Test (Right hand)',
    key: 'zipperTestRight',
    equipment: ['Ruler'],
    description: [
      '**Flexibility** - is the ability of the joints and muscles to move through its full range of motion.',
      '**Purpose** - to test the flexibility of the shoulder girdle.',
    ],
    instructionsForTester: [
      'Stand erect.',
      'Raise your right arm, bend your elbow, and reach down across your back as far as possible.',
      'Extend your left arm down and behind your back, bend your elbow up across your back, and try to reach/cross your fingers over those of your right hand as if to pull a zipper or scratch between the shoulder blades.',
      'To test the left shoulder, repeat the previous steps with the left hand over the left shoulder.',
    ],
    instructionsForPartner: [
      'Observe whether the fingers touched or overlapped each other, If not, measure the gap between the middle fingers of both hands.',
      'Record the distance in centimeters.',
    ],
    instructionsScoring: [
      'Record zipper test to the nearest 0.1 centimeter',
      'Record -1 if the fingers did not touch and 0 if the fingers barely touched',
    ],
    classification: [
      { min: 6, interpretation: 'Excellent' },
      { min: 4, max: 5.9, interpretation: 'Very Good' },
      { min: 2, max: 3.9, interpretation: 'Good' },
      { min: 0.1, max: 1.9, interpretation: 'Fair' },
      { exact: 0, interpretation: 'Needs Improvement' },
      { exact: -1, interpretation: 'Poor' },
    ],
    videoInstructions:
      'https://www.youtube.com/embed/fr7cj6TwBAI?si=yzhor91UOsxSklyX?autoplay=1',
    tips: [
      'Warm up your shoulders with gentle arm circles before attempting the zipper test.',
      'Keep your spine straight and avoid forcing the stretch to prevent shoulder injury.',
      'Practice daily shoulder stretches to improve flexibility and reach over time gradually.',
    ],
    unit: 'cm',
  },
  {
    title: 'Zipper Test (Left hand)',
    key: 'zipperTestLeft',
    description: [
      '**Flexibility** - is the ability of the joints and muscles to move through its full range of motion.',
      '**Purpose** - to test the flexibility of the shoulder girdle.',
    ],
    equipment: ['Ruler'],
    instructionsForTester: [
      'Stand erect.',
      'Raise your left arm, bend your elbow, and reach down across your back as far as possible.',
      'Extend your right arm down and behind your back, bend your elbow up across your back, and try to reach/cross your fingers over those of your left hand as if to pull a zipper or scratch between the shoulder blades.',
    ],
    instructionsForPartner: [
      'Observe whether the fingers touched or overlapped each other, If not, measure the gap between the middle fingers of both hands.',
      'Record the distance in centimeters.',
    ],
    instructionsScoring: [
      'Record zipper test to the nearest 0.1 centimeter',
      'Record -1 if the fingers did not touch and 0 if the fingers barely touched',
    ],
    classification: [
      { min: 6, interpretation: 'Excellent' },
      { min: 4, max: 5.9, interpretation: 'Very Good' },
      { min: 2, max: 3.9, interpretation: 'Good' },
      { min: 0.1, max: 1.9, interpretation: 'Fair' },
      { exact: 0, interpretation: 'Needs Improvement' },
      { exact: -1, interpretation: 'Poor' },
    ],
    videoInstructions:
      'https://www.youtube.com/embed/fr7cj6TwBAI?si=yzhor91UOsxSklyX?autoplay=1',
    tips: [
      'Alternate which arm goes over your shoulder to test both sides equally well.',
      'Breathe normally during the test and do not hold your breath while stretching.',
      'If fingers do not touch, focus on gradually improving shoulder mobility through exercise.',
    ],
  },
  {
    title: 'Sit and Reach (First Attempt)',
    key: 'sitAndReachFirst',
    description: [
      '**Flexibility** - is the ability of the joints and muscles to move through its full range of motion.',
      '**Purpose** - to test the flexibility of the lower extremities (particularly the trunk).',
    ],
    equipment: ['Tape measure or meter stick'],
    instructionsForTester: [
      'Sit on the floor with back, head and shoulders flat on the wall. Feet are 12 inches apart.',
      'Interlock thumbs and position the tip of the fingers on the floor without bending the elbows.',
      'After the partner has positioned the zero point of the tape measure/meter stick, (at the top of the middle fingers), the tester starts the test by sliding the hands slowly forward without jerking, trying to reach the farthest distance possible without bending the knees. ',
      'Bouncing or jerking movement is not allowed.',
      'Do it twice.',
    ],
    instructionsForPartner: [
      'As the tester assumes the (b) procedure, position the zero point of the tape measure at the tip of the middle fingers of the tester.',
      'See to it that the knees are not bent as the performer slides the farthest distance that he could.',
      'Record the farthest distance reached in centimeters.',
    ],
    instructionsScoring: [
      'Measure the reach distance in centimeters from the baseline (zero point on the Sit and Reach box).',
      'Scores above the baseline are positive; those not reaching it are recorded as negative.',
    ],
    classification: [
      { min: 61, interpretation: 'Excellent' },
      { min: 46, max: 60.9, interpretation: 'Very Good' },
      { min: 31, max: 45.9, interpretation: 'Good' },
      { min: 16, max: 30.9, interpretation: 'Fair' },
      { min: 0, max: 15.9, interpretation: 'Needs Improvement' },
    ],
    videoInstructions:
      'https://www.youtube.com/embed/4HhIr3nkrsI?si=hqQE1TX-MID9KrP0?autoplay=1',
    tips: [
      'Keep your back flat against the wall and avoid rounding your shoulders forward.',
      'Reach slowly and smoothly without bouncing or jerking movements for better results.',
      'Regular hamstring and lower back stretches will help improve your reach distance.',
    ],
    unit: 'cm',
  },
  {
    title: 'Sit and Reach (Second Attempt)',
    key: 'sitAndReachSecond',
    description: [
      '**Flexibility** - is the ability of the joints and muscles to move through its full range of motion.',
      '**Purpose** - to test the flexibility of the lower extremities (particularly the trunk).',
    ],
    equipment: ['Tape measure or meter stick'],
    instructionsForTester: [
      'Sit on the floor with back, head and shoulders flat on the wall. Feet are 12 inches apart.',
      'Interlock thumbs and position the tip of the fingers on the floor without bending the elbows.',
      'After the partner has positioned the zero point of the tape measure/meter stick, (at the top of the middle fingers), the tester starts the test by sliding the hands slowly forward without jerking, trying to reach the farthest distance possible without bending the knees. ',
      'Bouncing or jerking movement is not allowed.',
      'Do it twice.',
    ],
    instructionsForPartner: [
      'As the tester assumes the (b) procedure, position the zero point of the tape measure at the tip of the middle fingers of the tester.',
      'See to it that the knees are not bent as the performer slides the farthest distance that he could.',
      'Record the farthest distance reached in centimeters.',
    ],
    instructionsScoring: [
      'Measure the reach distance in centimeters from the baseline (zero point on the Sit and Reach box).',
      'Scores above the baseline are positive; those not reaching it are recorded as negative.',
    ],
    classification: [
      { min: 61, interpretation: 'Excellent' },
      { min: 46, max: 60.9, interpretation: 'Very Good' },
      { min: 31, max: 45.9, interpretation: 'Good' },
      { min: 16, max: 30.9, interpretation: 'Fair' },
      { min: 0, max: 15.9, interpretation: 'Needs Improvement' },
    ],
    videoInstructions:
      'https://www.youtube.com/embed/4HhIr3nkrsI?si=hqQE1TX-MID9KrP0?autoplay=1',
    tips: [
      'This is your second attempt, so apply what you learned from the first.',
      'Focus on controlled breathing and relaxation to achieve a better reach distance.',
      'Use the better score from both attempts as your final sit and reach.',
    ],
    unit: 'cm',
  },
  {
    title: 'Pre 3-Minute Step Test',
    key: 'preStepTest',
    description: [
      `**Cardiovascular endurance** - is the ability of the heart, lungs and blood vessels to
      deliver oxygen to working muscles and tissues, as well as the ability of those
      muscles and tissues to utilize the oxygen. Endurance may also refer to the
      ability of the muscle to do repeated work without fatigue.`,
      '**Purpose** - Purpose - to measure cardiovascular endurance before the 3-minute step test.',
    ],
    equipment: [
      'Stopwatch or timer',
      'Drum, clapper, clicker, metronome with speaker or any similar device',
    ],
    instructionsForTester: [
      'Stand at least one foot away from the step or bench with trunk erect and eyes looking straight ahead. ',
    ],
    instructionsForPartner: [
      'Allow the performer to locate his/her pulse.',
      'Give the signal to count the pulse beat.',
      'Let the performer count his/her pulse beat for 10 seconds and multiply it by 6.',
    ],
    instructionsScoring: ['Record the resting pulse of the tester'],
    videoInstructions:
      'https://www.youtube.com/embed/lg9dYlCQvnY?si=0lCp3v-zMOYoOMIE?autoplay=1',
    tips: [
      'Sit quietly and breathe normally for a few minutes before taking pulse.',
      'Practice finding your pulse on your wrist or neck before the actual test.',
      'Count accurately for ten seconds then multiply by six for heart rate.',
    ],
    unit: 'bpm',
  },
  {
    title: '3-Minute Step Test',
    key: 'stepTest',
    description: [
      `**Cardiovascular endurance** - is the ability of the heart, lungs and blood vessels to
      deliver oxygen to working muscles and tissues, as well as the ability of those
      muscles and tissues to utilize the oxygen. Endurance may also refer to the
      ability of the muscle to do repeated work without fatigue.`,
      '**Purpose** - Purpose - to measure cardiovascular endurance after the 3-minute step test.',
    ],
    equipment: [
      'Step with a height of 12 inches for secondary and 8 inches for elementaries',
      'Stopwatch or timer',
      'Drum, clapper, clicker, metronome with speaker or any similar device',
    ],
    instructionsForTester: [
      'Stand at least one foot away from the step or bench with trunk erect and eyes looking straight ahead. ',
      'The first step of the sequence should be alternate. At the signal "Go," step up and down the step/bench for 3 minutes at a rate of 96 beats per minute. One step consists of 4 beats — up with the left foot (ct. 1), up with the right foot (ct. 2), down with the left foot (ct. 3), down with the right foot (ct. 4) for the first sequence. Then up with the right foot (ct.1), up with the left foot (ct. 2), down with the right foot (ct. 3), down with the left foot (ct. 4) for the second sequence. Observe proper breathing (inhale through the nose, exhale through the mouth). ',
      'Immediately after the exercise, stand and locate your pulse and in five (5) seconds, or at a signal, start to get the heart rate. ',
      'Dont talk while taking the pulse beat.',
      'Count the pulse beat for 10 seconds and multiply it by 6.',
    ],
    instructionsForPartner: [
      'As the student assumes the position in front of the step, signal, "Ready" and "Go", start the stopwatch for the 3-minute step test.',
      'After the test, allow performer to locate his/her pulse in 5 seconds.',
      'Give the signal to count the pulse beat.',
      'Let the performer count his/her pulse beat for 10 seconds and multiply it by 6.',
    ],
    instructionsScoring: [
      'Record the 60-second pulse rate immediately after the activity.',
    ],
    videoInstructions:
      'https://www.youtube.com/embed/lg9dYlCQvnY?si=0lCp3v-zMOYoOMIE?autoplay=1',
    tips: [
      'Maintain steady rhythm throughout the test and do not rush the movements.',
      'Take your pulse immediately after finishing to get an accurate heart rate.',
      'Practice the stepping pattern beforehand to maintain proper form during test.',
    ],
    unit: 'bpm',
  },
  {
    title: 'Push-Up',
    key: 'pushUp',
    description: [
      '**Strength** - is the ability of the muscle to generate force against physical objects.',
      '**Purpose** - to measure strength of upper extremities',
    ],
    equipment: ['Exercise mats of any clean mat'],
    instructionsForTester: [
      'Lie down on the mat; face down in standard push-up position: palms on the mat about shoulder width, fingers pointing forward, and legs straight, parallel, and slightly apart, with the toes supporting the feet.',
      'FOR BOYS: Straighten the arms, keeping the back and knees straight, then lower the arms until there is a 90-degree angle at the elbows (upper arms are parallel to the floor). FOR GIRLS: With knees in contact with the floor, straightens the arms, keeping the back straight, then lowers the arms until there is a 90-degree angle at the elbows (upper arms are parallel to the floor). ',
      'Perform as many repetitions as possible, maintaining a cadence of 20 push-ups per minute. (2 seconds going down and I sec going up). ',
      'A maximum of 50 push-ups for boys and 25 push-ups for girls. ',
    ],
    instructionsForPartner: [
      'As the tester assumes the position of push-up, start counting as the tester lowers his/her body until he/she reaches 90-degree angle at the elbow. The partner should stand in front of the tester and his/her eyes should be close to elbow level to accurately judge the 90 degrees bend. ',
      'Make sure that the performer executes the push-ups in the correct form.',
      'The test is terminated when the performer can no longer execute the push-ups in the correct form, is in pain, voluntarily stops, or cadence is broken. ',
    ],
    instructionsScoring: ['Record the number of push-ups made'],

    classification: {
      elementaryBoys: [
        { min: 21, interpretation: 'Excellent' },
        { min: 16, max: 20, interpretation: 'Very Good' },
        { min: 11, max: 15, interpretation: 'Good' },
        { min: 6, max: 10, interpretation: 'Fair' },
        { min: 1, max: 5, interpretation: 'Needs Improvement' },
        { exact: 0, interpretation: 'Poor' },
      ],
      secondaryBoys: [
        { min: 33, interpretation: 'Excellent' },
        { min: 25, max: 32, interpretation: 'Very Good' },
        { min: 17, max: 24, interpretation: 'Good' },
        { min: 9, max: 6, interpretation: 'Fair' },
        { min: 1, max: 8, interpretation: 'Needs Improvement' },
        { exact: 0, interpretation: 'Poor' },
      ],
      elementaryGirls: [
        { min: 21, interpretation: 'Excellent' },
        { min: 16, max: 20, interpretation: 'Very Good' },
        { min: 11, max: 15, interpretation: 'Good' },
        { min: 6, max: 10, interpretation: 'Fair' },
        { min: 1, max: 5, interpretation: 'Needs Improvement' },
        { exact: 0, interpretation: 'Poor' },
      ],
      secondaryGirls: [
        { min: 33, interpretation: 'Excellent' },
        { min: 25, max: 32, interpretation: 'Very Good' },
        { min: 17, max: 24, interpretation: 'Good' },
        { min: 9, max: 6, interpretation: 'Fair' },
        { min: 1, max: 8, interpretation: 'Needs Improvement' },
        { exact: 0, interpretation: 'Poor' },
      ],
    },
    videoInstructions:
      'https://www.youtube.com/embed/b3rcKKnRfSI?si=dc7bPGUIylNECmd-?autoplay=1',
    tips: [
      'Keep your body straight from head to toes throughout the entire movement.',
      'Focus on controlled movements rather than speed to maintain proper push-up form.',
      'Build strength gradually with modified push-ups if you cannot complete standard ones.',
    ],
    unit: 'reps',
  },
  {
    title: 'Basic Plank',
    key: 'basicPlank',
    description: [
      '**Muscular Endurance** - is the ability of the muscle to perform continuous without fatigue.',
      '**Purpose** - to measure strength/stability of the core muscles',
    ],
    purpose: ['To measure strength/stability of the core muscles'],
    equipment: ['Exercise mats or any clean mat, stop watch/time piece'],
    instructionsForTester: [
      'Assume a push — up position. Rest body on forearms with palms and fingers flat on the floor. Elbows are aligned with the shoulders.',
      'legs are straight with ankles, knees and thighs touching together.',
      'Support weight on forearms and toes; make sure that your back is flat. head. neck and spine are in a straight line. ',
      'Keep abdominals engaged/contracted; do not let stomach drop or allow hips to rise.',
    ],
    instructionsForPartner: [
      'Ensure the availability of a mat/smooth flooring or anything that can protect the forearms.',
      'Give the signal "Start/Go" and start/press the time piece.',
      'Make sure that the back of the head, neck, spine and ankles are in a straight line',
      'Give two (2) warnings.',
      'Stop the time when the performer can no longer hold the required position, or, when the performer has held the position for at least 90 seconds.',
      'Holding the plank position beyond 90 seconds is considered unnecessary.',
    ],
    instructionsScoring: [
      'Record the time in seconds. Maximum of 90 seconds for Boys and Girls',
    ],
    classification: [
      { min: 51, interpretation: 'Excellent' },
      { min: 46, max: 50, interpretation: 'Very Good' },
      { min: 31, max: 45, interpretation: 'Good' },
      { min: 16, max: 30, interpretation: 'Fair' },
      { min: 1, max: 15, interpretation: 'Needs Improvement' },
    ],
    videoInstructions:
      'https://www.youtube.com/embed/XVKH1MdJNTY?si=a_ofVPZ3byzbDK4X?autoplay=1',
    tips: [
      'Engage your core muscles and breathe steadily throughout the entire plank hold.',
      'Keep your body in a straight line from head to heels without sagging.',
      'Start with shorter holds and gradually increase time to build core strength.',
    ],
    unit: 'sec(s)',
  },
];
