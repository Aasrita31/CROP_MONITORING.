import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state from HTML class list
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card/65 text-foreground hover:border-emerald-500/40 hover:bg-accent/55 transition duration-300 shadow-sm group"
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-amber-400 group-hover:scale-110 group-hover:rotate-45 transition-all duration-300" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-slate-500 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
      )}
    </button>
  );
}
