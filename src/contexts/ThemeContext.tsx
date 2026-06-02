import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('primaryColor') || '#0C4F5F'); // Default theme color #0C4F5F
  const [secondaryColor, setSecondaryColor] = useState(() => localStorage.getItem('secondaryColor') || '#ffffff'); // Default white

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
    document.documentElement.style.setProperty('--color-primary', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('secondaryColor', secondaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);
  }, [secondaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
