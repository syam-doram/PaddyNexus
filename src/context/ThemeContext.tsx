import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as Theme) || 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    console.log('Theme changed to:', theme);
    if (theme === 'dark') {
      console.log('Adding dark class to html');
      root.classList.add('dark');
    } else {
      console.log('Removing dark class from html');
      root.classList.remove('dark');
    }
    console.log('HTML classes after update:', root.className);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Set default theme based on role if no preference exists
  useEffect(() => {
    const saved = localStorage.getItem('app_theme');
    if (!saved && user?.role) {
      if (user.role === 'trader') {
        setThemeState('dark');
      } else {
        setThemeState('light');
      }
    }
  }, [user]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
