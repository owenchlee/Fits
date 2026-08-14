export interface SeedProgramExercise {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetRpe?: number;
  restSeconds: number;
}

export interface SeedProgramDay {
  name: string;
  exercises: SeedProgramExercise[];
}

export interface SeedProgram {
  name: string;
  description: string;
  author: string;
  daysPerWeek: number;
  days: SeedProgramDay[];
}

export const seedPrograms: SeedProgram[] = [
  {
    name: "StrongLifts 5x5",
    description:
      "The classic beginner barbell program. Two alternating workouts, three lifts each, straight sets of 5. Add weight every session while you can.",
    author: "Built-in",
    daysPerWeek: 3,
    days: [
      {
        name: "Workout A",
        exercises: [
          { exerciseName: "Back Squat", targetSets: 5, targetReps: "5", restSeconds: 150 },
          { exerciseName: "Barbell Bench Press", targetSets: 5, targetReps: "5", restSeconds: 150 },
          { exerciseName: "Barbell Row", targetSets: 5, targetReps: "5", restSeconds: 120 },
        ],
      },
      {
        name: "Workout B",
        exercises: [
          { exerciseName: "Back Squat", targetSets: 5, targetReps: "5", restSeconds: 150 },
          { exerciseName: "Overhead Press", targetSets: 5, targetReps: "5", restSeconds: 150 },
          { exerciseName: "Deadlift", targetSets: 1, targetReps: "5", restSeconds: 180 },
        ],
      },
    ],
  },
  {
    name: "Push / Pull / Legs",
    description:
      "A balanced hypertrophy split run 3-6 days a week. Rotate Push, Pull, Legs in order and repeat, taking a rest day whenever you need one.",
    author: "Built-in",
    daysPerWeek: 6,
    days: [
      {
        name: "Push",
        exercises: [
          { exerciseName: "Barbell Bench Press", targetSets: 4, targetReps: "6-8", targetRpe: 8, restSeconds: 120 },
          { exerciseName: "Overhead Press", targetSets: 3, targetReps: "8-10", targetRpe: 8, restSeconds: 100 },
          { exerciseName: "Incline Dumbbell Press", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseName: "Triceps Pushdown", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseName: "Lateral Raise", targetSets: 3, targetReps: "15-20", restSeconds: 60 },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { exerciseName: "Deadlift", targetSets: 3, targetReps: "5", targetRpe: 8, restSeconds: 180 },
          { exerciseName: "Pull-Up", targetSets: 4, targetReps: "AMRAP", restSeconds: 120 },
          { exerciseName: "Barbell Row", targetSets: 3, targetReps: "8-10", restSeconds: 100 },
          { exerciseName: "Face Pull", targetSets: 3, targetReps: "15-20", restSeconds: 60 },
          { exerciseName: "Barbell Curl", targetSets: 3, targetReps: "10-12", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { exerciseName: "Back Squat", targetSets: 4, targetReps: "6-8", targetRpe: 8, restSeconds: 150 },
          { exerciseName: "Romanian Deadlift", targetSets: 3, targetReps: "8-10", restSeconds: 100 },
          { exerciseName: "Leg Press", targetSets: 3, targetReps: "10-12", restSeconds: 90 },
          { exerciseName: "Leg Curl", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
          { exerciseName: "Standing Calf Raise", targetSets: 4, targetReps: "15-20", restSeconds: 45 },
        ],
      },
    ],
  },
  {
    name: "5/3/1 for Beginners",
    description:
      "Jim Wendler's percentage-based strength program. Main lift works up to a heavy top set off your training max, then light accessory volume.",
    author: "Built-in",
    daysPerWeek: 4,
    days: [
      {
        name: "Overhead Press Day",
        exercises: [
          { exerciseName: "Overhead Press", targetSets: 5, targetReps: "5/5/3+", targetRpe: 9, restSeconds: 150 },
          { exerciseName: "Lat Pulldown", targetSets: 5, targetReps: "10", restSeconds: 75 },
          { exerciseName: "Dip (Triceps-Focused)", targetSets: 5, targetReps: "10-15", restSeconds: 75 },
        ],
      },
      {
        name: "Deadlift Day",
        exercises: [
          { exerciseName: "Deadlift", targetSets: 5, targetReps: "5/5/3+", targetRpe: 9, restSeconds: 180 },
          { exerciseName: "Hanging Leg Raise", targetSets: 5, targetReps: "10-15", restSeconds: 75 },
        ],
      },
      {
        name: "Bench Press Day",
        exercises: [
          { exerciseName: "Barbell Bench Press", targetSets: 5, targetReps: "5/5/3+", targetRpe: 9, restSeconds: 150 },
          { exerciseName: "Barbell Row", targetSets: 5, targetReps: "10", restSeconds: 90 },
          { exerciseName: "Dumbbell Curl", targetSets: 5, targetReps: "10-15", restSeconds: 60 },
        ],
      },
      {
        name: "Squat Day",
        exercises: [
          { exerciseName: "Back Squat", targetSets: 5, targetReps: "5/5/3+", targetRpe: 9, restSeconds: 180 },
          { exerciseName: "Leg Curl", targetSets: 5, targetReps: "10-15", restSeconds: 75 },
          { exerciseName: "Plank", targetSets: 3, targetReps: "45s", restSeconds: 45 },
        ],
      },
    ],
  },
  {
    name: "GZCLP",
    description:
      "A linear progression built on GZCL tiers: a heavy T1 main lift, a moderate T2 secondary lift, and high-rep T3 accessory work each day.",
    author: "Built-in",
    daysPerWeek: 4,
    days: [
      {
        name: "Day 1",
        exercises: [
          { exerciseName: "Back Squat", targetSets: 5, targetReps: "3+", targetRpe: 9, restSeconds: 150 },
          { exerciseName: "Barbell Bench Press", targetSets: 3, targetReps: "10", restSeconds: 100 },
          { exerciseName: "Lat Pulldown", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Day 2",
        exercises: [
          { exerciseName: "Overhead Press", targetSets: 5, targetReps: "3+", targetRpe: 9, restSeconds: 150 },
          { exerciseName: "Deadlift", targetSets: 3, targetReps: "10", targetRpe: 8, restSeconds: 150 },
          { exerciseName: "Barbell Curl", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Day 3",
        exercises: [
          { exerciseName: "Barbell Bench Press", targetSets: 5, targetReps: "3+", targetRpe: 9, restSeconds: 150 },
          { exerciseName: "Back Squat", targetSets: 3, targetReps: "10", restSeconds: 120 },
          { exerciseName: "Seated Cable Row", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
      {
        name: "Day 4",
        exercises: [
          { exerciseName: "Deadlift", targetSets: 5, targetReps: "3+", targetRpe: 9, restSeconds: 180 },
          { exerciseName: "Overhead Press", targetSets: 3, targetReps: "10", restSeconds: 100 },
          { exerciseName: "Lat Pulldown", targetSets: 3, targetReps: "15", restSeconds: 60 },
        ],
      },
    ],
  },
];
