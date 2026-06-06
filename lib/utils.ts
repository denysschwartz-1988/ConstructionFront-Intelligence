import { type ClassValue, clsx } from "clsx";
import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStageBadgeStyle(stage: string | null | undefined): CSSProperties {
  if (!stage) {
    return { backgroundColor: "#8b949e", color: "#ffffff" };
  }

  const s = stage.toLowerCase();

  if (s.includes("under development")) {
    return { backgroundColor: "#f0a500", color: "#0d1117" };
  }

  if (s.includes("fid") || s.includes("procurement") || s.includes("financing")) {
    return { backgroundColor: "#f0a500", color: "#0d1117" };
  }

  if (s.includes("contract awarded")) {
    return { backgroundColor: "#238636", color: "#ffffff" };
  }

  if (s.includes("under construction")) {
    return { backgroundColor: "#1a7f37", color: "#ffffff" };
  }

  if (s.includes("construction complete") || s.includes("operational")) {
    return { backgroundColor: "#1f6feb", color: "#ffffff" };
  }

  if (s.includes("on hold") || s.includes("cancelled")) {
    return { backgroundColor: "#6e7681", color: "#ffffff" };
  }

  return { backgroundColor: "#6e7681", color: "#ffffff" };
}

export function cleanCityArea(cityArea: string | null | undefined): string {
  if (!cityArea) {
    return "";
  }

  const stopPatterns = [", ", " of ", " to ", " near ", " connecting", " approximately"];
  let result = cityArea;

  for (const pattern of stopPatterns) {
    const index = result.indexOf(pattern);
    if (index > 0) {
      result = result.substring(0, index);
    }
  }

  return result.trim().substring(0, 40);
}
