"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/** Just the two — no "System" option, so the app never inherits some other look. */
export type Theme = "light" | "dark";

const STORAGE_KEY = "paytrack-theme";

interface ThemeContextValue {
  theme: Theme;
  resolved: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  resolved: "light",
  setTheme: () => {},
});

/** Applies the theme to <html> and remembers the choice on this device. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const apply = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    // No choice saved yet — start from the device's own setting, once.
    const initial =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setThemeState(initial);
    apply(initial);
  }, [apply]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode — the theme still applies for this visit.
      }
      apply(next);
    },
    [apply]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolved: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Runs before the first paint so the app never flashes the wrong theme. Sets
 * the background colour directly via inline style — not just the .dark class
 * — because that paints immediately, without waiting on globals.css to finish
 * downloading. On a slow first load, waiting for the stylesheet is exactly
 * what shows up as a flash of plain white before the app's own background.
 */
export const themeScript = `
try {
  var saved = localStorage.getItem('${STORAGE_KEY}');
  var dark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) { document.documentElement.classList.add('dark'); }
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.documentElement.style.backgroundColor = dark ? '#000000' : '#f7f7fb';
} catch (e) {}
`;
