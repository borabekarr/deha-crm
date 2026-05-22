export const duration = {
  instant: 80,
  fast: 160,
  base: 220,
  slow: 320,
  emphasized: 480,
} as const;
export type DurationToken = keyof typeof duration;
