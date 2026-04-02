"use client";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "app_theme";

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
};

export const saveTheme = (theme: ThemeMode) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
};
