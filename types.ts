
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  role: 'admin' | 'manager' | 'super_admin' | 'user' | string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status: 'regular' | 'vip' | 'admin' | string;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  table_number: number;
  seats: number;
  is_available: boolean;
}

export interface Booking {
  id: string;
  group_id: string;
  customer_id: string;
  table_id: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  duration: number; // Duration in minutes
  // Joined fields
  customer_name?: string;
  table_number?: number;
  customer?: Customer;
  table?: RestaurantTable;
}

export interface AdminBookingView {
  group_id: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  duration: number;
  party_size: number; // Aggregated
  table_numbers: string; // Aggregated
  status: string; // Derived
  customer_id?: string; // For smart actions
  customer_user_id?: string | null; // For smart actions
}

export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'email' | 'other';
  url: string;
}

export interface OpeningHour {
  id: string;
  name: string; // e.g. "Weekdays"
  time: string; // e.g. "10:00 AM - 9:00 PM"
  name_translations?: Record<string, string>;
  time_translations?: Record<string, string>;
}

export interface DaySchedule {
  day: string; // "Monday", "Tuesday", etc.
  isOpen: boolean;
  openTime: string; // "HH:mm" 24h format
  closeTime: string; // "HH:mm" 24h format
  hasBreak: boolean;
  breakStart: string; // "HH:mm" 24h format
  breakEnd: string; // "HH:mm" 24h format
}

export interface RestaurantSettings {
  id?: number;
  restaurant_name: string;
  description: string; // Default/Fallback description
  description_translations?: Record<string, string>; // Map of langCode -> translated text
  logo_url: string;
  hero_image_url: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: OpeningHour[]; // Footer display text
  booking_schedule?: DaySchedule[]; // Functional schedule logic
  
  // Appearance
  primary_color: string; // Hex code for Gold accents
  color_background?: string; // Main background (Dark Mode)
  color_background_light?: string; // Main background (Light Mode)
  color_surface?: string; // Cards/Secondary
  color_border?: string;
  
  // Typography
  font_heading: string;
  font_body: string;
  theme_mode: 'light' | 'dark';
  
  // Config
  social_links?: SocialLink[];
  branding_style: 'text' | 'logo' | 'both'; // Navbar branding
  default_duration?: number; // Default booking duration in minutes
  active_languages?: string[]; // List of enabled language codes
  
  // New Fields
  hero_branding_style: 'text' | 'logo' | 'both';
  logo_height_navbar: number; // px
  logo_height_hero: number; // px
  content_width: number; // percentage (e.g. 80)
}