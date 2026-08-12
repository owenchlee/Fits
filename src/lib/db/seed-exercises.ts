import type { Exercise } from "@/lib/db/types";

type SeedExercise = Omit<Exercise, "id" | "isCustom" | "updatedAt">;

const list: SeedExercise[] = [
  // Chest
  { name: "Barbell Bench Press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", standardLift: "bench" },
  { name: "Incline Barbell Bench Press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "bench", ratio: 0.82 } },
  { name: "Dumbbell Bench Press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "bench", ratio: 0.75 } },
  { name: "Incline Dumbbell Press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "bench", ratio: 0.65 } },
  { name: "Dumbbell Fly", primaryMuscle: "chest", secondaryMuscles: [], equipment: "dumbbell", standardLift: null },
  { name: "Cable Crossover", primaryMuscle: "chest", secondaryMuscles: [], equipment: "cable", standardLift: null },
  { name: "Push-Up", primaryMuscle: "chest", secondaryMuscles: ["triceps", "core"], equipment: "bodyweight", standardLift: null },
  { name: "Dip (Chest-Focused)", primaryMuscle: "chest", secondaryMuscles: ["triceps"], equipment: "bodyweight", standardLift: null },
  { name: "Machine Chest Press", primaryMuscle: "chest", secondaryMuscles: ["triceps"], equipment: "machine", standardLift: null, standardLiftRatio: { basedOn: "bench", ratio: 0.9 } },

  // Back
  { name: "Deadlift", primaryMuscle: "back", secondaryMuscles: ["hamstrings", "glutes", "traps"], equipment: "barbell", standardLift: "deadlift" },
  { name: "Sumo Deadlift", primaryMuscle: "back", secondaryMuscles: ["glutes", "hamstrings"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "deadlift", ratio: 0.95 } },
  { name: "Romanian Deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "deadlift", ratio: 0.8 } },
  { name: "Pull-Up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", standardLift: null },
  { name: "Chin-Up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", standardLift: null },
  { name: "Lat Pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", standardLift: null },
  { name: "Barbell Row", primaryMuscle: "back", secondaryMuscles: ["biceps", "traps"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "deadlift", ratio: 0.6 } },
  { name: "Pendlay Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "deadlift", ratio: 0.55 } },
  { name: "T-Bar Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "machine", standardLift: null },
  { name: "Seated Cable Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", standardLift: null },
  { name: "Dumbbell Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", standardLift: null },
  { name: "Rack Pull", primaryMuscle: "back", secondaryMuscles: ["traps", "hamstrings"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "deadlift", ratio: 1.15 } },
  { name: "Face Pull", primaryMuscle: "shoulders", secondaryMuscles: ["back", "traps"], equipment: "cable", standardLift: null },

  // Shoulders
  { name: "Overhead Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "barbell", standardLift: "overhead-press" },
  { name: "Seated Dumbbell Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "overhead-press", ratio: 0.85 } },
  { name: "Arnold Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "overhead-press", ratio: 0.75 } },
  { name: "Lateral Raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "dumbbell", standardLift: null },
  { name: "Cable Lateral Raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "cable", standardLift: null },
  { name: "Rear Delt Fly", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "dumbbell", standardLift: null },
  { name: "Shrug", primaryMuscle: "traps", secondaryMuscles: [], equipment: "barbell", standardLift: null },

  // Arms
  { name: "Barbell Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", standardLift: null },
  { name: "EZ-Bar Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", standardLift: null },
  { name: "Dumbbell Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", standardLift: null },
  { name: "Hammer Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", standardLift: null },
  { name: "Preacher Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "machine", standardLift: null },
  { name: "Cable Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "cable", standardLift: null },
  { name: "Close-Grip Bench Press", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "bench", ratio: 0.9 } },
  { name: "Triceps Pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", standardLift: null },
  { name: "Skull Crusher", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "barbell", standardLift: null },
  { name: "Overhead Triceps Extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "dumbbell", standardLift: null },
  { name: "Dip (Triceps-Focused)", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "bodyweight", standardLift: null },
  { name: "Wrist Curl", primaryMuscle: "forearms", secondaryMuscles: [], equipment: "dumbbell", standardLift: null },

  // Legs
  { name: "Back Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "barbell", standardLift: "squat" },
  { name: "Front Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 0.85 } },
  { name: "Goblet Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 0.5 } },
  { name: "Leg Press", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "machine", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 2.2 } },
  { name: "Bulgarian Split Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 0.4 } },
  { name: "Walking Lunge", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 0.35 } },
  { name: "Leg Extension", primaryMuscle: "quads", secondaryMuscles: [], equipment: "machine", standardLift: null },
  { name: "Leg Curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "machine", standardLift: null },
  { name: "Hip Thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 1.3 } },
  { name: "Glute Bridge", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "bodyweight", standardLift: null },
  { name: "Standing Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", standardLift: null },
  { name: "Seated Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", standardLift: null },
  { name: "Hip Abduction Machine", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "machine", standardLift: null },

  // Core
  { name: "Plank", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", standardLift: null },
  { name: "Hanging Leg Raise", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", standardLift: null },
  { name: "Cable Crunch", primaryMuscle: "core", secondaryMuscles: [], equipment: "cable", standardLift: null },
  { name: "Ab Wheel Rollout", primaryMuscle: "core", secondaryMuscles: [], equipment: "other", standardLift: null },
  { name: "Russian Twist", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", standardLift: null },
  { name: "Weighted Sit-Up", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", standardLift: null },

  // Full body / Olympic
  { name: "Power Clean", primaryMuscle: "full-body", secondaryMuscles: ["back", "quads", "traps"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "deadlift", ratio: 0.65 } },
  { name: "Kettlebell Swing", primaryMuscle: "full-body", secondaryMuscles: ["glutes", "hamstrings"], equipment: "kettlebell", standardLift: null },
  { name: "Farmer's Carry", primaryMuscle: "full-body", secondaryMuscles: ["forearms", "traps"], equipment: "dumbbell", standardLift: null },
  { name: "Thruster", primaryMuscle: "full-body", secondaryMuscles: ["shoulders", "quads"], equipment: "barbell", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 0.5 } },
  { name: "Burpee", primaryMuscle: "full-body", secondaryMuscles: ["core"], equipment: "bodyweight", standardLift: null },
];

export const seedExercises: SeedExercise[] = list;
