
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RestaurantSettings, OpeningHour, DaySchedule } from '../types';
import { getSettings } from '../services/api';
import { LANGUAGES } from '../lib/constants';
// IMPORTANT: Use relative path for locales to avoid alias resolution issues in browser
import { resources } from '../locales/index';

// Default Schedule
const DEFAULT_SCHEDULE: DaySchedule[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
].map(day => ({
  day,
  isOpen: true,
  openTime: '11:30',
  closeTime: '22:00',
  hasBreak: true,
  breakStart: '14:00',
  breakEnd: '17:30'
}));

// Default Fallback Settings
const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurant_name: "Hói Bán Sushi",
  description: "Premium Japanese Dining Experience. Authentic flavors crafted with precision and passion.",
  description_translations: {},
  logo_url: "",
  hero_image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop",
  address: "43 An Hải 20, Đà Nẵng",
  phone: "+84942659839",
  email: "contact@sushihoiban.com",
  opening_hours: [
    { id: '1', name: 'Mon - Sun', time: '10:00 AM - 2:00 PM' },
    { id: '2', name: '', time: '4:30 PM - 9:30 PM' }
  ],
  booking_schedule: DEFAULT_SCHEDULE,
  primary_color: "#f59e0b", 
  color_background: "#0a0a0a",
  color_background_light: "#d4d4d4", 
  color_surface: "#171717",
  color_border: "#262626",
  font_heading: "Playfair Display",
  font_body: "Inter",
  theme_mode: 'dark',
  branding_style: 'both',
  social_links: [
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'instagram', url: 'https://instagram.com' }
  ],
  hero_branding_style: 'text',
  logo_height_navbar: 40,
  logo_height_hero: 120,
  content_width: 80,
  default_duration: 90,
  active_languages: ['en', 'vi'] 
};

// Helper to shade colors
const adjustColor = (color: string, amount: number) => {
  if (!color) return '#000000';
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

interface SettingsContextType {
  settings: RestaurantSettings;
  savedSettings: RestaurantSettings;
  loading: boolean;
  refreshSettings: () => Promise<RestaurantSettings | null>;
  updatePreview: (newSettings: RestaurantSettings) => void;
  persistLocalSettings: (newSettings: RestaurantSettings) => void;
  resetToSaved: () => void;
  currentLanguage: { code: string; label: string };
  setLanguage: (code: string) => void;
  getLocalizedText: (defaultText: string, translations?: Record<string, string>) => string;
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
  formatDuration: (minutes: number) => string;
  formatTime: (time: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  savedSettings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => null,
  updatePreview: () => {},
  persistLocalSettings: () => {},
  resetToSaved: () => {},
  currentLanguage: LANGUAGES[0],
  setLanguage: () => {},
  getLocalizedText: (t) => t,
  t: (k) => k,
  formatCurrency: (v) => `${v}`,
  formatDuration: (m) => `${m}m`,
  formatTime: (t) => t
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  
  // Global Language State
  const [currentLangCode, setCurrentLangCode] = useState('en');

  const fetchSettings = async () => {
    try {
      const data: any = await getSettings();
      if (data) {
        let normalizedHours: OpeningHour[] = DEFAULT_SETTINGS.opening_hours;
        if (Array.isArray(data.opening_hours)) {
          normalizedHours = data.opening_hours;
        } else if (typeof data.opening_hours === 'string') {
          normalizedHours = [{ id: '1', name: 'Regular Hours', time: data.opening_hours }];
        }

        const merged = { 
          ...DEFAULT_SETTINGS, 
          ...data, 
          opening_hours: normalizedHours,
          // Ensure schedule exists
          booking_schedule: data.booking_schedule || DEFAULT_SCHEDULE,
          description_translations: data.description_translations || {}
        };
        
        if (!merged.default_duration) merged.default_duration = 90;
        if (!merged.active_languages) merged.active_languages = ['en', 'vi'];

        setSettings(merged);
        setSavedSettings(merged);
        return merged;
      }
      return null;
    } catch (err) {
      console.error("Failed to load settings, using defaults", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const resetToSaved = useCallback(() => {
    setSettings(savedSettings);
  }, [savedSettings]);

  const persistLocalSettings = useCallback((newSettings: RestaurantSettings) => {
    setSettings(newSettings);
    setSavedSettings(newSettings);
  }, []);

  // Language Helpers
  const setLanguage = (code: string) => setCurrentLangCode(code);
  
  const currentLanguage = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];

  const getLocalizedText = (defaultText: string, translations?: Record<string, string>) => {
    if (!translations) return defaultText;
    return translations[currentLangCode] || defaultText;
  };

  // The Translation Function
  const t = useCallback((key: string): string => {
    if (!key) return "";
    const [namespace, stringKey] = key.split('.');
    
    // @ts-ignore
    const group = resources[namespace];
    if (group && group[stringKey]) {
      // @ts-ignore
      const translation = group[stringKey][currentLangCode];
      // Fallback to English if translation is missing for current lang
      // @ts-ignore
      return translation || group[stringKey]['en'] || key;
    }
    return key;
  }, [currentLangCode]);

  const formatCurrency = useCallback((value: number): string => {
    // If locale is Vietnamese, format as VND
    if (currentLangCode === 'vi') {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value * 25000); // Rough conversion for demo
    }
    // Default USD for others
    return new Intl.NumberFormat(currentLangCode === 'en' ? 'en-US' : 'en-US', { style: 'currency', currency: 'USD' }).format(value);
  }, [currentLangCode]);

  const formatDuration = useCallback((minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    const hLabel = t('common.unit_hour'); // localized 'h'
    const mLabel = t('common.unit_minute'); // localized 'm'

    if (h > 0 && m > 0) return `${h}${hLabel} ${m}${mLabel}`;
    if (h > 0) return `${h}${hLabel}`;
    return `${m}${mLabel}`;
  }, [t]);

  const formatTime = useCallback((time: string): string => {
    if (!time) return '';
    // Format is assumed to be HH:mm
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    // Use Intl to format time according to locale (e.g. 12h for US, 24h for VN/EU usually)
    // Note: Browser defaults might vary, but we request reasonable defaults
    return new Intl.DateTimeFormat(currentLangCode, {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  }, [currentLangCode]);

  // Update HTML Lang Attribute
  useEffect(() => {
    document.documentElement.lang = currentLangCode;
  }, [currentLangCode]);

  // Apply CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const primary = settings.primary_color || '#f59e0b';
    root.style.setProperty('--color-primary-500', primary);
    root.style.setProperty('--color-primary-400', adjustColor(primary, 40)); 
    root.style.setProperty('--color-primary-600', adjustColor(primary, -40));

    const isDark = (settings.theme_mode || 'dark') === 'dark';
    let bg, surface, border, textMain, textMuted;

    if (isDark) {
      bg = settings.color_background || '#0a0a0a';
      surface = settings.color_surface || '#171717';
      border = settings.color_border || '#262626';
      textMain = '#e5e5e5';
      textMuted = '#a3a3a3';
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      bg = settings.color_background_light || '#d4d4d4'; 
      surface = '#ffffff'; 
      border = '#d4d4d4';  
      textMain = '#111827'; 
      textMuted = '#4b5563'; 
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    root.style.setProperty('--color-dark-900', bg);
    root.style.setProperty('--color-dark-800', surface);
    root.style.setProperty('--color-dark-700', border);
    root.style.setProperty('--color-text-main', textMain);
    root.style.setProperty('--color-text-muted', textMuted);

    document.body.style.backgroundColor = bg;
    document.body.style.color = textMain;

    root.style.setProperty('--font-sans', settings.font_body === 'Inter' ? '"Inter", sans-serif' : '"Playfair Display", serif');
    root.style.setProperty('--font-serif', settings.font_heading === 'Playfair Display' ? '"Playfair Display", serif' : '"Inter", sans-serif');
    root.style.setProperty('--content-width', `${settings.content_width || 80}%`);

  }, [settings]);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      savedSettings,
      loading, 
      refreshSettings: fetchSettings,
      updatePreview: setSettings,
      persistLocalSettings,
      resetToSaved,
      currentLanguage,
      setLanguage,
      getLocalizedText,
      t,
      formatCurrency,
      formatDuration,
      formatTime
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
