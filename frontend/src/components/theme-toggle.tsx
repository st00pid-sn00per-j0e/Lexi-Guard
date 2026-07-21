"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Read theme from localStorage or document class
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const documentClass = document.documentElement.className;
    
    if (savedTheme) {
      setTheme(savedTheme);
      // Ensure the class matches
      if (!documentClass.includes(savedTheme)) {
        document.documentElement.className = savedTheme;
      }
    } else {
      // Default is dark mode based on initial index.html
      setTheme("dark");
      document.documentElement.className = "dark";
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.className = nextTheme;
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-border/40 hover:bg-accent/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm bg-card/60 backdrop-blur-sm"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5 text-accent animate-pulse-glow" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-primary" />
      )}
    </button>
  );
}
