import { useTheme as useThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const theme = useThemeContext();
  
  // Check if dark mode is active
  const isDarkMode = theme.darkMode;
  
  // Check if light mode is active
  const isLightMode = !theme.darkMode;
  
  // Toggle theme function
  const toggleTheme = theme.toggleTheme;
  
  // Get current theme name
  const getThemeName = () => theme.darkMode ? 'dark' : 'light';
  
  // Get opposite theme name
  const getOppositeThemeName = () => theme.darkMode ? 'light' : 'dark';
  
  // Get theme icon
  const getThemeIcon = () => theme.darkMode ? '☀️' : '🌙';
  
  // Get theme button text
  const getThemeButtonText = () => `${getThemeIcon()} ${getOppositeThemeName()} Mode`;
  
  return {
    // Theme state
    darkMode: theme.darkMode,
    lightMode: !theme.darkMode,
    
    // Computed values
    isDarkMode,
    isLightMode,
    themeName: getThemeName(),
    oppositeThemeName: getOppositeThemeName(),
    themeIcon: getThemeIcon(),
    themeButtonText: getThemeButtonText(),
    
    // Actions
    toggleTheme,
    
    // Raw context
    context: theme,
  };
};
