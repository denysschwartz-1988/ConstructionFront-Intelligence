import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStageColor(currentProjectStage?: string) {
  const stage = currentProjectStage?.trim().toLowerCase() ?? "";

  if (
    stage.includes("under development") ||
    stage.includes("fid") ||
    stage.includes("procurement") ||
    stage.includes("financing")
  ) {
    return "#E8A020";
  }

  if (stage.includes("contract awarded") || stage.includes("under construction")) {
    return "#74c69d";
  }

  if (stage.includes("construction complete") || stage.includes("operational")) {
    return "#7fb3ff";
  }

  return "#E8A020";
}
