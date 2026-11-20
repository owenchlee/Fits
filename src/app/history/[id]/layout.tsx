import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workout details — Fits" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
