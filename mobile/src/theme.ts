export const palettes = {
  light: {
    bg: "#F4F6F3",
    card: "#FFFFFF",
    ink: "#182A23",
    muted: "#617169",
    accent: "#146C4E",
    soft: "#E7F2E9",
    border: "#DFE6DF",
    hero: "#142D24",
    lime: "#C6F16E",
    error: "#B42E36",
  },
  dark: {
    bg: "#0D1713",
    card: "#16251E",
    ink: "#F0F6EF",
    muted: "#ACBDB1",
    accent: "#9EE2B6",
    soft: "#213E2E",
    border: "#30483B",
    hero: "#1D382B",
    lime: "#C6F16E",
    error: "#FFADB2",
  },
};
export type Palette = typeof palettes.light;
export type ThemePreference = "system" | "light" | "dark";
export function resolveTheme(
  preference: ThemePreference,
  system: string | null | undefined,
) {
  return preference === "system"
    ? system === "dark"
      ? "dark"
      : "light"
    : preference;
}
