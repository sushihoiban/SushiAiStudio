
# Sushi Hoiban - Setup Instructions

## 1. Fix Permissions & Policies (CRITICAL)

If you are experiencing issues where **delete or cancel buttons do nothing**, it is because Row Level Security (RLS) is enabled but missing proper policies. Run this script in the Supabase SQL Editor to fix it.

```sql
-- ENABLE RLS on all tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. Bookings Policies
DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access bookings" ON public.bookings;
CREATE POLICY "Admin full access bookings" ON public.bookings FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 2. Customers Policies
DROP POLICY IF EXISTS "Public read customers" ON public.customers;
CREATE POLICY "Public read customers" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert customers" ON public.customers;
CREATE POLICY "Public insert customers" ON public.customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access customers" ON public.customers;
CREATE POLICY "Admin full access customers" ON public.customers FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 3. Restaurant Tables Policies
DROP POLICY IF EXISTS "Public read tables" ON public.restaurant_tables;
CREATE POLICY "Public read tables" ON public.restaurant_tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access tables" ON public.restaurant_tables;
CREATE POLICY "Admin full access tables" ON public.restaurant_tables FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 4. Settings Policies (Already in previous scripts, ensuring here)
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access settings" ON public.settings;
CREATE POLICY "Admin full access settings" ON public.settings FOR ALL USING (
  auth.role() = 'authenticated'
);
```

## 2. Database Schema Setup (Run if new)

Run this entire script to create tables and seed initial data.

```sql
-- Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER NOT NULL,
  seats INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'regular',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  table_id UUID REFERENCES public.restaurant_tables(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  party_size INTEGER NOT NULL,
  duration INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_name TEXT NOT NULL DEFAULT 'Hói Bán Sushi',
  description TEXT DEFAULT 'Premium Japanese Dining Experience.',
  logo_url TEXT,
  hero_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
  address TEXT DEFAULT '43 An Hải 20, Đà Nẵng',
  phone TEXT DEFAULT '+84942659839',
  email TEXT DEFAULT 'contact@sushihoiban.com',
  opening_hours JSONB DEFAULT '[{"id": "1", "name": "Mon - Sun", "time": "10:00 AM - 2:00 PM"}, {"id": "2", "name": "", "time": "4:30 PM - 9:30 PM"}]'::jsonb,
  branding_style TEXT DEFAULT 'both',
  primary_color TEXT DEFAULT '#f59e0b',
  color_background TEXT DEFAULT '#0a0a0a',
  color_background_light TEXT DEFAULT '#e5e5e5',
  color_surface TEXT DEFAULT '#171717',
  color_border TEXT DEFAULT '#262626',
  font_heading TEXT DEFAULT 'Playfair Display',
  font_body TEXT DEFAULT 'Inter',
  theme_mode TEXT DEFAULT 'dark',
  hero_branding_style TEXT DEFAULT 'text',
  logo_height_navbar INTEGER DEFAULT 40,
  logo_height_hero INTEGER DEFAULT 120,
  content_width INTEGER DEFAULT 80,
  social_links JSONB DEFAULT '[]'::jsonb,
  active_languages JSONB DEFAULT '["en"]'::jsonb,
  default_duration INTEGER DEFAULT 90,
  booking_schedule JSONB,
  description_translations JSONB
);

-- Insert Default Settings
INSERT INTO public.settings (restaurant_name)
SELECT 'Hói Bán Sushi'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);
```

## 3. Update for Roles and Active Languages

Run this to enable Manager/Super Admin roles and language selection.

```sql
-- 1. Update Settings Table for Active Languages
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS active_languages JSONB DEFAULT '["en"]'::jsonb;

-- 2. Update Profiles Check Constraint (if enforced)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'manager', 'super_admin'));
```

## 4. Team Management Permissions

```sql
-- ... (Team management policies as before)
```

## 5. Promote Yourself to Super Admin

```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@HERE.COM'
);
```

## 6. New Features Update (Schedule & Translations)

Run this to add the new columns for the advanced schedule and translations.

```sql
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS booking_schedule JSONB,
ADD COLUMN IF NOT EXISTS description_translations JSONB;
```

## 7. Fix Customer Status Constraint

If you encounter errors when setting a customer status to 'Super Admin' (Error 23514), run this SQL to update the allowed values.

```sql
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_status_check;
ALTER TABLE public.customers ADD CONSTRAINT customers_status_check CHECK (status IN ('regular', 'vip', 'admin', 'super_admin'));
```
