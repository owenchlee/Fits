import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ActiveWorkoutBar } from "@/components/train/active-workout-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <BottomNav />
      <ActiveWorkoutBar />
      <main className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))] md:ml-60 md:pb-8">
        <div className="mx-auto w-full max-w-5xl px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
