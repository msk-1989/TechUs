"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CurrentTester {
  id: string;
  name: string;
  role: string;
  color: string;
}

interface TesterStore {
  currentTester: CurrentTester | null;
  setCurrentTester: (t: CurrentTester | null) => void;
  clear: () => void;
}

export const useTesterStore = create<TesterStore>()(
  persist(
    (set) => ({
      currentTester: null,
      setCurrentTester: (t) => set({ currentTester: t }),
      clear: () => set({ currentTester: null }),
    }),
    { name: "hidayah-qa-tester" }
  )
);

// Color → Tailwind classes for badges & avatars
export const TESTER_COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string; dot: string; gradient: string }> = {
  emerald: { bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200",  dot: "bg-emerald-500",  gradient: "from-emerald-500 to-teal-600" },
  violet:  { bg: "bg-violet-50",   text: "text-violet-700",   ring: "ring-violet-200",   dot: "bg-violet-500",   gradient: "from-violet-500 to-purple-600" },
  amber:   { bg: "bg-amber-50",    text: "text-amber-700",    ring: "ring-amber-200",    dot: "bg-amber-500",    gradient: "from-amber-500 to-orange-600" },
  sky:     { bg: "bg-sky-50",      text: "text-sky-700",      ring: "ring-sky-200",      dot: "bg-sky-500",      gradient: "from-sky-500 to-blue-600" },
  rose:    { bg: "bg-rose-50",     text: "text-rose-700",     ring: "ring-rose-200",     dot: "bg-rose-500",     gradient: "from-rose-500 to-pink-600" },
  teal:    { bg: "bg-teal-50",     text: "text-teal-700",     ring: "ring-teal-200",     dot: "bg-teal-500",     gradient: "from-teal-500 to-cyan-600" },
  slate:   { bg: "bg-slate-100",   text: "text-slate-700",    ring: "ring-slate-200",    dot: "bg-slate-500",    gradient: "from-slate-500 to-slate-700" },
};

export function testerColor(color: string) {
  return TESTER_COLOR_CLASSES[color] ?? TESTER_COLOR_CLASSES.emerald;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
