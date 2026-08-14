// Theme management utilities for PuffNotes
export const THEMES = {
  WARM: 'warm',
  GALAXY: 'galaxy',
  KOMOREBI: 'komorebi'
};

export const THEME_ORDER = [THEMES.WARM, THEMES.GALAXY, THEMES.KOMOREBI];

const THEME_STORAGE_KEY = 'puffnotes_theme_v1';

/**
 * Get the stored theme from localStorage
 * @returns {string} The stored theme or WARM as default
 */
export const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored && Object.values(THEMES).includes(stored) ? stored : THEMES.WARM;
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
    return THEMES.WARM;
  }
};

/**
 * Store the theme in localStorage
 * @param {string} theme - The theme to store
 */
export const setStoredTheme = (theme) => {
  try {
    if (Object.values(THEMES).includes(theme)) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
      console.warn('Invalid theme:', theme);
    }
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
};

/**
 * Get theme-specific color mappings
 * @param {string} theme - The theme name
 * @returns {object} Color mappings for the theme
 */
export const getThemeColors = (theme) => {
  const colorMappings = {
    [THEMES.WARM]: {
      background: {
        main: '#fdf6ec',
        panel: '#ffffff',
        focus: '#fdfbf7',
        modal: '#ffffff'
      },
      text: {
        primary: '#1a1a1a',
        secondary: '#333333',
        muted: '#6b7280',
        placeholder: '#9ca3af'
      },
      border: {
        primary: '#e6ddcc',
        secondary: '#e0ddd5',
        focus: '#9a8c73'
      },
      accent: {
        primary: '#9a8c73',
        secondary: '#8c6e54',
        hover: '#f0e9df'
      },
      shadow: 'rgba(61, 46, 38, 0.1)',
      glow: 'rgba(224, 123, 83, 0.3)'
    },
    [THEMES.GALAXY]: {
      background: {
        main: '#0a0e27',
        panel: '#0f1642',
        focus: '#0d1235',
        modal: '#0f1642'
      },
      text: {
        primary: '#e8eaf6',
        secondary: '#b8bfde',
        muted: '#8b9dc3',
        placeholder: '#6c7b95'
      },
      border: {
        primary: '#2d3561',
        secondary: '#4a5178',
        focus: '#9b59b6'
      },
      accent: {
        primary: '#9b59b6',
        secondary: '#e74c3c',
        hover: '#8e44ad'
      },
      shadow: 'rgba(10, 14, 39, 0.4)',
      glow: 'rgba(155, 89, 182, 0.3)'
    },
    [THEMES.KOMOREBI]: {
      background: {
        main: '#071c20',
        panel: '#352820',
        focus: '#3b2d24',
        modal: '#30241d'
      },
      text: {
        primary: '#f4ebd7',
        secondary: '#dfd2b9',
        muted: '#b8aa90',
        placeholder: '#ad9d84'
      },
      border: {
        primary: '#685541',
        secondary: '#514233',
        focus: '#e7bd87'
      },
      accent: {
        primary: '#b7cd9b',
        secondary: '#bd734d',
        hover: '#4a392d'
      },
      shadow: 'rgba(7, 28, 32, 0.26)',
      glow: 'rgba(231, 189, 135, 0.24)'
    }
  };

  return colorMappings[theme] || colorMappings[THEMES.WARM];
};

/**
 * Get theme-specific video sources
 * @param {string} theme - The theme name
 * @returns {Array} Array of video source objects with src and type
 */
export const getThemeVideos = (theme) => {
  const videoMappings = {
    [THEMES.WARM]: [
      { src: '/puff.mp4', type: 'video/mp4' },
      { src: '/puff.webm', type: 'video/webm' }
    ],
    [THEMES.GALAXY]: [
      { src: '/galaxy.webm', type: 'video/webm' },
      { src: '/galaxy.mp4', type: 'video/mp4' }
    ],
    [THEMES.KOMOREBI]: [
      { src: '/komorebi.mp4', type: 'video/mp4' },
      { src: '/komorebi.webm', type: 'video/webm' }
    ]
  };

  return videoMappings[theme] || videoMappings[THEMES.WARM];
};

/**
 * Get theme-specific video source (legacy function for backward compatibility)
 * @param {string} theme - The theme name
 * @returns {string} Primary video source path
 */
export const getThemeVideo = (theme) => {
  const videos = getThemeVideos(theme);
  return videos[0].src;
};

/**
 * Get theme-specific video type (legacy function for backward compatibility)
 * @param {string} theme - The theme name
 * @returns {string} Primary video MIME type
 */
export const getThemeVideoType = (theme) => {
  const videos = getThemeVideos(theme);
  return videos[0].type;
};

/**
 * Get the next theme in sequence
 * @param {string} currentTheme - Current theme
 * @returns {string} Next theme
 */
export const getNextTheme = (currentTheme) => {
  const currentIndex = THEME_ORDER.indexOf(currentTheme);
  if (currentIndex === -1) return THEMES.WARM;
  const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
  return THEME_ORDER[nextIndex];
};

/**
 * Get the previous theme in sequence
 * @param {string} currentTheme - Current theme
 * @returns {string} Previous theme
 */
export const getPreviousTheme = (currentTheme) => {
  const currentIndex = THEME_ORDER.indexOf(currentTheme);
  if (currentIndex === -1) return THEMES.WARM;
  const prevIndex = currentIndex === 0 ? THEME_ORDER.length - 1 : currentIndex - 1;
  return THEME_ORDER[prevIndex];
};

/**
 * Check if a theme is valid
 * @param {string} theme - Theme to validate
 * @returns {boolean} True if valid
 */
export const isValidTheme = (theme) => {
  return Object.values(THEMES).includes(theme);
};
