import type { Reference, WorkoutVideo } from '@/types/workout';

export const WarmUpVideo: WorkoutVideo[] = [
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-warm-ups.jpg',
    url: 'warm-up',
    duration: '02:17',
    title: 'Warm Up',
    description: {
      howToDoIt:
        'Sit or stand up straight with a weight in each hand at shoulder height. Push the weights straight up until your arms are straight, then lower them slowly back down.',
      do: [],
      dont: [],
    },
    videoLink: 'https://www.youtube.com/embed/WUY4QYFeuHU?si=kS4aVzRqr4BI7qY4',
    uploadDate: '2025-08-21T14:48:00.000Z',
  },
];

export const UpperBodyVideos: WorkoutVideo[] = [
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-shoulder-press.jpg',
    url: 'shoulder-press',
    duration: '00:44',
    title: 'Shoulder Press',
    description: {
      howToDoIt:
        'Sit or stand up straight with a weight in each hand at shoulder height. Push the weights straight up until your arms are straight, then lower them slowly back down.',
      do: ['Keep your back straight.', 'Press the weights slowly.'],
      dont: ["Don't arch your back.", "Don't lock your elbows."],
    },
    videoLink: 'https://www.youtube.com/embed/ga_BY_AM8Sk?si=oi9qTpWw1mYaD5h-',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-incline-chest-press.jpg',
    url: 'incline-chest-press',
    duration: '00:56',
    title: 'Incline Chest Press',
    description: {
      howToDoIt:
        'Sit or stand up straight with a weight in each hand at shoulder height. Push the weights straight up until your arms are straight, then lower them slowly back down.',
      do: [
        'Adjust the seat so that the handles are aligned with your upper chest.',
        'Keep your back and head supported against the pad.',
        'Use slow, controlled movements.',
      ],
      dont: [
        "Don't lock your elbows at the top.",
        "Don't shrug your shoulders or lift them off the pad.",
        "Don't allow the weights to slam down.",
      ],
    },
    videoLink: 'https://www.youtube.com/embed/H1c1Pmb1cvc?si=t8122qQHtCbnskVo',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-standing-dumbbell-overhead-press.jpg',
    url: 'standing-dumbell-overhead',
    duration: '00:51',
    title: 'Standing Dumbbell Overhead Press',
    description: {
      howToDoIt:
        'Sit or stand up straight with a weight in each hand at shoulder height. Push the weights straight up until your arms are straight, then lower them slowly back down.',
      do: [
        'Keep a neutral spine and brace your core.',
        'Maintain control throughout the movement.',
        'Exhale as you press, inhale as you lower.',
      ],
      dont: [
        "Don't arch your back excessively.",
        "Don't let the dumbbells drift too far forward or backward.",
        "Don't use momentum or swing your body.",
      ],
    },
    videoLink: 'https://www.youtube.com/embed/3YbzkFrXEek?si=IJDRAFwybBUbtcZE',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-close-grip-lat-pulldown.jpg',
    url: 'close-grip-lat-pulldown',
    duration: '00:49',
    title: 'Close Grip Lat Pulldown',
    description: {
      howToDoIt:
        'Sit at the lat pulldown machine. Pull the bar down to your chest, then let it go back up slowly.',
      do: ['Sit up tall.', 'Pull with your back muscles.'],
      dont: ["Don't lean back too far.", "Don't pull behind your head."],
    },
    videoLink: 'https://www.youtube.com/embed/maRhBqMBvCw?si=S4HK2kJbxUP_o08I',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-triceps-pulldown.jpg',
    url: 'triceps-pulldown',
    duration: '00:33',
    title: 'Triceps Pushdown',
    description: {
      howToDoIt:
        'Stand at a cable machine with a bar or rope. Push it down until your arms are straight, then let it come back up slowly.',
      do: [
        'Keep your elbows still and close to your body.',
        'Use a full range of motion.',
      ],
      dont: ["Don't move your shoulders.", "Don't lean too far forward."],
    },
    videoLink: 'https://www.youtube.com/embed/Fj0KSvKi8Po?si=tywkHvXX246bAx98',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-bicep-curl.jpg',
    url: 'bicep-curl',
    duration: '00:40',
    title: 'Bicep Curl',
    description: {
      howToDoIt:
        'Hold a dumbbell in each hand, arms at your sides. Curl the weights up to your shoulders. Lower slowly.',
      do: ['Keep your elbows close to your body.', 'Lift slowly.'],
      dont: ["Don't swing your body.", "Don't use your shoulders."],
    },
    videoLink: 'https://www.youtube.com/embed/Siucbbk0Oxs?si=sl87yaCZGwIQaFn1',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
];

export const LowerBodyVideos: WorkoutVideo[] = [
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-deadlift.jpg',
    url: 'deadlift',
    duration: '01:08',
    title: 'Deadlifts',
    description: {
      howToDoIt:
        'Stand with feet hip-width apart and a barbell (or dumbbells) in front of you. Hinge at the hips and slightly bend your knees to grip the weight. Keep your back flat and chest up. Drive through your heels to lift the weight, extending your hips and knees fully. Lower it back down with control by hinging at the hips again.',
      do: [
        'Engage your core and keep your back straight.',
        'Use your legs and glutes to lift.',
        'Keep the bar or weights close to your body.',
      ],
      dont: [
        "Don't round your back.",
        "Don't yank the weight up with your arms.",
        "Don't hyperextend your back at the top.",
      ],
    },
    videoLink: 'https://www.youtube.com/embed/r_TBbbX8wF0?si=0IlKzaW9Xeq7DnjP',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-squats.jpg',
    url: 'squats',
    duration: '00:43',
    title: 'Squats',
    description: {
      howToDoIt:
        'Stand with feet shoulder-width apart and toes slightly turned out. Keep your chest lifted and back straight. Bend your hips and knees to lower your body as if sitting in a chair. Go as low as you can while keeping heels on the ground. Push through your heels to return to standing.',
      do: [
        'Keep knees aligned with toes.',
        'Engage your core throughout the movement.',
        'Squat to at least parallel if your flexibility allows.',
      ],
      dont: [
        "Don't let your knees collapse inward.",
        "Don't rise onto your toes.",
        "Don't arch or round your back.",
      ],
    },
    videoLink: 'https://www.youtube.com/embed/WJKuVjXnVZg?si=IxjWckzdFOPaB7yP',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
  {
    thumbnail:
      'https://pcgsdfbkpnfgcvdopgzz.supabase.co/storage/v1/object/public/WorkoutZoneCovers/cover-split-squat.png',
    url: 'split-squats',
    duration: '00:48',
    title: 'Split Squats',
    description: {
      howToDoIt:
        'Stand with one foot forward and the other behind you in a split stance. Lower your back knee toward the ground while keeping your torso upright. Push through the front heel to return to the starting position.',
      do: [
        'Keep your chest up and back straight.',
        'Ensure your front knee tracks over your ankle.',
        'Lower under control and push through your heel.',
      ],
      dont: [
        'Let your front knee go past your toes.',
        'Lean your upper body forward.',
        'Rush the movement or lose balance.',
      ],
    },
    videoLink: 'https://www.youtube.com/embed/BKTAwDzybPI?si=L15IY3EqOtIfUtMA',
    uploadDate: '2025-07-23T14:00:00.000Z',
  },
];

export const References: Reference[] = [
  {
    name: '[1] Davis, N. (2022, June 28). How to do a goblet squat — and why you should. *Healthline*.',
    link: 'https://www.healthline.com/health/fitness-exercise/dumbbell-goblet-squat',
  },
  {
    name: '[2] Exercise Library: Romanian deadlift. (n.d.). *Health and Fitness Certifications, Continuing Education & Resources | ACE*.',
    link: 'https://www.acefitness.org/resources/everyone/exercise-library/317/romanian-deadlift/',
  },
  {
    name: '[3] Exercise Library: Seated chest press. (n.d.). *Health and Fitness Certifications, Continuing Education & Resources | ACE*.',
    link: 'https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/',
  },
  {
    name: '[4] Exercise Library: Seated overhead press. (n.d.). *Health and Fitness Certifications, Continuing Education & Resources | ACE*.',
    link: 'https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/',
  },
  {
    name: '[5] Exercise Library: Seated shoulder press. (n.d.). *Health and Fitness Certifications, Continuing Education & Resources | ACE*.',
    link: 'https://www.acefitness.org/resources/everyone/exercise-library/186/seated-shoulder-press/',
  },
  {
    name: '[6] Exercise Library: Triceps Pushdowns. (n.d.). *Health and Fitness Certifications, Continuing Education & Resources | ACE*.',
    link: 'https://www.acefitness.org/resources/everyone/exercise-library/185/triceps-pushdowns/',
  },
  {
    name: '[7] Hammer strength machine incline bench press: Video exercise guide & tips. (2017, November 27). *Muscle & Strength*.',
    link: 'https://www.muscleandstrength.com/exercises/hammer-strength-incline-bench-press',
  },
  {
    name: '[8] How to do a dumbbell overhead press: Techniques, benefits, variations. (2007, July 24). *Verywell Fit*.',
    link: 'https://www.verywellfit.com/how-to-do-the-dumbbell-overhead-press-3498298',
  },
  {
    name: '[9] How to use a chest press machine: Benefits and variations. (2008, November 7). *Verywell Fit*.',
    link: 'https://www.verywellfit.com/how-to-do-the-seated-machine-chest-press-3498292',
  },
  {
    name: "[10] LAMPA, T., BREITOWICH, A., & SMITH, J. (2025, March 20). If regular squats are boring, try one of these variations. *Women's Health*.",
    link: 'https://www.womenshealthmag.com/fitness/a19904135/types-of-squats/',
  },
  {
    name: '[11] Read, T. (2023, July 13). Deadlift benefits: 8 ways this exercise supercharges results. *Healthline*.',
    link: 'https://www.healthline.com/health/fitness/deadlift-benefits#what-they-are',
  },
  {
    name: '[12] Rogers, P. (2024, May 10). How to do Tricep Pushdowns: Techniques, benefits, variations. *Verywell Fit*.',
    link: 'https://www.verywellfit.com/how-to-do-the-triceps-pushdown-3498613',
  },
  {
    name: '[13] Seated close-grip chest press. (n.d.). *Health and Fitness Certifications, Continuing Education & Resources | ACE*.',
    link: 'https://www.acefitness.org/resources/everyone/exercise-library/189/seated-close-grip-chest-press/',
  },
];
