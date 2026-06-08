import { type ClassValue, clsx } from "clsx";
import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return "\u2014";
  }

  try {
    let date: Date;

    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      date = new Date(`${year}-${month}-${day}`);
    } else {
      date = new Date(dateStr);
    }

    if (Number.isNaN(date.getTime())) {
      return "\u2014";
    }

    return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return "\u2014";
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  return formatMonthYear(dateStr);
}

export function formatMilestoneDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year) return "";

  // Month is placeholder or missing - show year only
  if (!month || month === 1 && day === 1 && dateStr.endsWith("01-01")) {
    return String(year);
  }

  // Month available - show MMM YYYY (ignore day entirely)
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric"
  });
}

export function formatProjectValue(
  amount: number | null | undefined,
  currency: string | null | undefined,
  scale: string | null | undefined
): string {
  if (amount == null) return "";

  let value = Number(amount);
  const curr = currency?.trim() ?? "";
  const scaleLower = scale?.trim().toLowerCase() ?? "";
  let displayScale = scale?.trim() ?? "";

  if (scaleLower === "million" || scaleLower === "m") {
    if (value >= 1000) {
      value = value / 1000;
      displayScale = "Billion";
    } else {
      displayScale = "Million";
    }
  } else if (scaleLower === "billion" || scaleLower === "b") {
    displayScale = "Billion";
  }

  const formatted = parseFloat(value.toFixed(2)).toLocaleString();
  return [curr, formatted, displayScale].filter(Boolean).join(" ");
}

export function getStageBadgeStyle(stage: string | null | undefined): CSSProperties {
  if (!stage) {
    return { backgroundColor: "#8b949e", color: "#ffffff" };
  }

  const s = stage.toLowerCase();

  if (s.includes("under development")) {
    return { backgroundColor: "#f0a500", color: "#0a1628" };
  }

  if (s.includes("fid") || s.includes("procurement") || s.includes("financing")) {
    return { backgroundColor: "#f0a500", color: "#0a1628" };
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
