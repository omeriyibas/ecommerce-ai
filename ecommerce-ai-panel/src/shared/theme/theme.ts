export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "app-theme";

const isThemeMode = (value: string | null): value is ThemeMode => {
  return value === "light" || value === "dark";
};

const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(value) ? value : null;
};

export const getPreferredTheme = (): ThemeMode => {
  return getStoredTheme() ?? getSystemTheme();
};

export const applyTheme = (theme: ThemeMode): void => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const setTheme = (theme: ThemeMode): void => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  applyTheme(theme);
};

export const initializeTheme = (): ThemeMode => {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
};
