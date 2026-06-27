import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const moduleSurfaceClasses =
  "border-1 border-border dark:border-card rounded-3xl shadow-xl transition-all bg-card [.bg-card_&]:bg-secondary/50 [.bg-card_&]:dark:bg-secondary [.bg-card_&]:dark:border-secondary [.bg-secondary_&]:dark:bg-card [.bg-secondary_&]:dark:border-card";

export function formatTime(
  seconds: number,
  smallResolution: boolean = true
): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const fraction = seconds % 1; // Get decimal part

  if (smallResolution) {
    if (seconds < 10) {
      return `${minutes}:${secs.toString().padStart(2, "0")}.${Math.floor(
        fraction * 10
      )}`; // Shows tenths of a second
    }
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
