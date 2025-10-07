'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative h-8 w-16 cursor-pointer rounded-full bg-gray-200 shadow-inner transition-colors duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-gray-700"
      aria-label="Toggle theme"
    >
      <div
        className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] dark:translate-x-full dark:bg-gray-900"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] dark:rotate-0 dark:scale-100 text-yellow-400 dark:text-gray-400" />
      </div>
    </button>
  );
}