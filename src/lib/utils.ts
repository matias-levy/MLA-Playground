import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const fraction = seconds % 1; // Get decimal part

  if (seconds < 10) {
    return `${minutes}:${secs.toString().padStart(2, "0")}.${Math.floor(
      fraction * 10
    )}`; // Shows tenths of a second
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
