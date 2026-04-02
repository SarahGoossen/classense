"use client";

export type ThemeMode = "light" | "dark" | "auto";

export const THEME_STORAGE_KEY = "app_theme";
export const AUTO_LIGHT_START_HOUR = 7;
export const AUTO_DARK_START_HOUR = 19;

export const resolveThemeMode = (theme: ThemeMode, date = new Date()) => {
  if (theme === "auto") {
    const hour = date.getHours();
    return hour >= AUTO_LIGHT_START_HOUR && hour < AUTO_DARK_START_HOUR
      ? "light"
      : "dark";
  }

  return theme;
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", resolveThemeMode(theme) === "dark");
};

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "auto";

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "auto"
    ? stored
    : "auto";
};

export const saveTheme = (theme: ThemeMode) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
};
