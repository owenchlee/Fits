/**
 * Hand-written to match supabase/migrations/0001_init.sql. If the schema drifts, prefer
 * regenerating this with `supabase gen types typescript` once the project is linked.
 *
 * `Relationships: []` and the empty `Views`/`Functions` are required boilerplate — @supabase/postgrest-js's
 * generics silently collapse to `never` without them (see GenericTable/GenericSchema in its types).
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          unit_system: "kg" | "lb";
          sex: "male" | "female";
          bodyweight_kg: number;
          default_rest_seconds: number;
          bar_weight_kg: number;
          available_plates_kg: number[];
          streak: number;
          last_workout_date: string | null;
          active_program_id: string | null;
          active_program_day_index: number | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          primary_muscle: string;
          secondary_muscles: string[];
          equipment: string;
          is_unilateral: boolean | null;
          is_custom: boolean;
          standard_lift: string | null;
          standard_lift_ratio: { basedOn: string; ratio: number } | null;
          notes: string | null;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["exercises"]["Row"]> & { id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          author: string;
          days_per_week: number;
          is_custom: boolean;
          days: unknown;
          schedule: unknown;
          cycle_start_date: string | null;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["programs"]["Row"]> & { id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["programs"]["Row"]>;
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          program_id: string | null;
          program_day_name: string | null;
          title: string;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
          bodyweight_kg: number | null;
          exercise_order: string[];
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["workouts"]["Row"]> & { id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Row"]>;
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          exercise_id: string;
          set_index: number;
          weight_kg: number;
          reps: number;
          rpe: number | null;
          is_warmup: boolean;
          is_failure: boolean;
          is_drop_set: boolean;
          completed_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sets"]["Row"]> & { id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["sets"]["Row"]>;
        Relationships: [];
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          measurements: Record<string, number> | null;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["body_metrics"]["Row"]> & { id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["body_metrics"]["Row"]>;
        Relationships: [];
      };
      percentile_snapshots: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          overall_percentile: number | null;
          per_lift: Record<string, number>;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["percentile_snapshots"]["Row"]> & {
          id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["percentile_snapshots"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
