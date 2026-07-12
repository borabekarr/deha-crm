export const PRIMARY_THEMES = ['emerald', 'sunflower', 'bloodymary', 'petalglow', 'sexyblue', 'richgold'] as const
export type PrimaryTheme = (typeof PRIMARY_THEMES)[number]
