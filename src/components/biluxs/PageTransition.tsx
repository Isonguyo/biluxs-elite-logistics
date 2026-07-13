import { ReactNode } from "react";

// Simple pass-through wrapper. Previously animated a full-screen wipe overlay
// which could occasionally leave the viewport blank on slower devices and
// conflicted with per-page splash screens. Motion still lives on individual
// sections via framer-motion viewport reveals.
export function PageTransition({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
