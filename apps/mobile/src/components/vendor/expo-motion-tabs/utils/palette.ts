import type { IPalette } from "../typings/motion-tabs";

function palette<T extends "dark" | "light">(scheme: T): IPalette {
  if (scheme === "dark") {
    return {
      foreground: "#f5f5f7",
      muted: "#8e8e93",
      surface: "rgba(24,24,27,0.92)",
      border: "rgba(255,255,255,0.06)",
      input: "rgba(255,255,255,0.06)",
      hover: "rgba(255,255,255,0.06)",
      accent: "rgba(255,255,255,0.10)",
    };
  }

  return {
    foreground: "#0a0a0a",
    muted: "#71717a",
    surface: "rgba(245,245,247,0.94)",
    border: "rgba(0,0,0,0.06)",
    input: "rgba(0,0,0,0.04)",
    hover: "rgba(0,0,0,0.04)",
    accent: "rgba(0,0,0,0.06)",
  };
}

export { palette };
