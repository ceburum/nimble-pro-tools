
-- Create professions table as single source of truth
CREATE TABLE public.professions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Briefcase',
  description TEXT,
  business_type TEXT NOT NULL DEFAULT 'stationary_appointment' CHECK (business_type IN ('mobile_job', 'stationary_appointment')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  setup_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_menu_library table for read-only templates
CREATE TABLE public.service_menu_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  profession_id UUID NOT NULL REFERENCES public.professions(id) ON DELETE CASCADE,
  description TEXT,
  preview_items JSONB NOT NULL DEFAULT '[]',
  services JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  available_in_setup BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  price_cents INTEGER NOT NULL DEFAULT 299,
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_services table for user's editable services
CREATE TABLE public.user_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration INTEGER,
  thumbnail_url TEXT,
  bg_color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_library_id UUID REFERENCES public.service_menu_library(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for user_services lookup
CREATE INDEX idx_user_services_user_id ON public.user_services(user_id);
CREATE INDEX idx_service_menu_library_profession ON public.service_menu_library(profession_id);

-- Enable RLS
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_menu_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

-- Professions are readable by everyone (public catalog)
CREATE POLICY "Professions are viewable by everyone" 
ON public.professions FOR SELECT USING (true);

-- Service menu library is readable by everyone (public catalog)
CREATE POLICY "Service menu library is viewable by everyone" 
ON public.service_menu_library FOR SELECT USING (true);

-- User services policies
CREATE POLICY "Users can view their own services" 
ON public.user_services FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services" 
ON public.user_services FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" 
ON public.user_services FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" 
ON public.user_services FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_professions_updated_at
BEFORE UPDATE ON public.professions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_menu_library_updated_at
BEFORE UPDATE ON public.service_menu_library
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_services_updated_at
BEFORE UPDATE ON public.user_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing professions from the current hardcoded list
INSERT INTO public.professions (slug, display_name, icon, description, business_type, setup_order) VALUES
('salon', 'Hair Salon', 'Scissors', 'Full-service hair styling and treatments', 'stationary_appointment', 1),
('barber', 'Barbershop', 'Scissors', 'Men''s grooming and haircuts', 'stationary_appointment', 2),
('massage', 'Massage Therapy', 'Heart', 'Therapeutic massage services', 'stationary_appointment', 3),
('pet_grooming', 'Pet Grooming', 'Dog', 'Professional pet grooming services', 'stationary_appointment', 4),
('fitness', 'Fitness Studio', 'Dumbbell', 'Personal training and fitness classes', 'stationary_appointment', 5),
('personal_training', 'Personal Training', 'Dumbbell', 'One-on-one fitness coaching', 'stationary_appointment', 6),
('photography', 'Photography', 'Camera', 'Professional photography services', 'stationary_appointment', 7),
('tutoring', 'Tutoring', 'GraduationCap', 'Educational tutoring services', 'stationary_appointment', 8),
('bakery', 'Bakery', 'CakeSlice', 'Custom baked goods and treats', 'stationary_appointment', 9),
('catering', 'Catering', 'ChefHat', 'Event catering services', 'stationary_appointment', 10),
('event_planning', 'Event Planning', 'PartyPopper', 'Professional event coordination', 'stationary_appointment', 11),
('handyman', 'Handyman', 'Wrench', 'General home repairs and maintenance', 'mobile_job', 20),
('plumbing', 'Plumbing', 'Droplet', 'Plumbing installation and repairs', 'mobile_job', 21),
('electrical', 'Electrical', 'Zap', 'Electrical installation and repairs', 'mobile_job', 22),
('hvac', 'HVAC', 'Thermometer', 'Heating and cooling services', 'mobile_job', 23),
('painting', 'Painting', 'Paintbrush', 'Interior and exterior painting', 'mobile_job', 24),
('lawn_care', 'Lawn Care', 'Trees', 'Lawn maintenance and care', 'mobile_job', 25),
('landscaping', 'Landscaping', 'Flower', 'Landscape design and installation', 'mobile_job', 26),
('cleaning', 'Cleaning', 'Sparkles', 'Professional cleaning services', 'mobile_job', 27),
('car_wash', 'Mobile Car Wash', 'Car', 'Mobile car detailing services', 'mobile_job', 28),
('mobile_mechanic', 'Mobile Mechanic', 'Wrench', 'On-site auto repair services', 'mobile_job', 29),
('auto_repair', 'Auto Repair', 'Car', 'Automotive repair services', 'mobile_job', 30),
('it_support', 'IT Support', 'Monitor', 'Computer and tech support', 'mobile_job', 31),
('moving', 'Moving Services', 'Truck', 'Professional moving and relocation', 'mobile_job', 32),
('hair_stylist', 'Mobile Hair Stylist', 'Scissors', 'Mobile hairstyling services', 'mobile_job', 33),
-- 5 NEW professions
('tattoo_artist', 'Tattoo Artist', 'Pen', 'Custom tattoo design and application', 'stationary_appointment', 12),
('music_lessons', 'Music Lessons', 'Music', 'Private music instruction', 'stationary_appointment', 13),
('interior_design', 'Interior Design', 'Palette', 'Professional interior design services', 'mobile_job', 34),
('home_staging', 'Home Staging', 'Home', 'Real estate staging services', 'mobile_job', 35),
('notary_services', 'Notary Services', 'FileSignature', 'Mobile notary and signing services', 'mobile_job', 36);

-- Seed service menu library packs for existing professions
INSERT INTO public.service_menu_library (title, profession_id, description, preview_items, services, is_featured) VALUES
-- Salon pack
('Complete Salon Services', (SELECT id FROM public.professions WHERE slug = 'salon'), 'Full hair salon service menu with 50+ services', 
'["Women''s Haircut", "Men''s Haircut", "Color & Highlights", "Blowout", "Deep Conditioning"]'::jsonb,
'[{"name": "Women''s Haircut", "price": 45, "duration": 45}, {"name": "Men''s Haircut", "price": 25, "duration": 30}, {"name": "Kids Haircut (12 & under)", "price": 20, "duration": 25}, {"name": "Bang Trim", "price": 10, "duration": 10}, {"name": "Beard Trim", "price": 15, "duration": 15}, {"name": "Single Process Color", "price": 75, "duration": 90}, {"name": "Double Process Color", "price": 120, "duration": 120}, {"name": "Partial Highlights", "price": 85, "duration": 90}, {"name": "Full Highlights", "price": 125, "duration": 120}, {"name": "Balayage", "price": 150, "duration": 150}, {"name": "Ombre", "price": 140, "duration": 120}, {"name": "Color Correction", "price": 200, "duration": 180}, {"name": "Gloss Treatment", "price": 35, "duration": 30}, {"name": "Root Touch-Up", "price": 55, "duration": 60}, {"name": "Blowout", "price": 35, "duration": 30}, {"name": "Updo", "price": 65, "duration": 45}, {"name": "Bridal Updo", "price": 100, "duration": 60}, {"name": "Deep Conditioning Treatment", "price": 25, "duration": 20}, {"name": "Keratin Treatment", "price": 250, "duration": 180}, {"name": "Brazilian Blowout", "price": 300, "duration": 180}, {"name": "Perm", "price": 120, "duration": 120}, {"name": "Relaxer", "price": 85, "duration": 90}, {"name": "Extensions Consultation", "price": 0, "duration": 30}, {"name": "Tape-In Extensions (per pack)", "price": 150, "duration": 60}, {"name": "Extension Removal", "price": 50, "duration": 45}, {"name": "Scalp Treatment", "price": 30, "duration": 30}, {"name": "Olaplex Treatment", "price": 40, "duration": 20}, {"name": "Eyebrow Wax", "price": 15, "duration": 10}, {"name": "Lip Wax", "price": 10, "duration": 10}, {"name": "Chin Wax", "price": 12, "duration": 10}]'::jsonb, true),

-- Barber pack
('Complete Barbershop Menu', (SELECT id FROM public.professions WHERE slug = 'barber'), 'Professional barbershop services', 
'["Classic Haircut", "Fade", "Beard Trim", "Hot Towel Shave", "Hair Design"]'::jsonb,
'[{"name": "Classic Haircut", "price": 25, "duration": 30}, {"name": "Skin Fade", "price": 30, "duration": 35}, {"name": "Mid Fade", "price": 28, "duration": 35}, {"name": "Low Fade", "price": 28, "duration": 35}, {"name": "Taper", "price": 25, "duration": 30}, {"name": "Buzz Cut", "price": 18, "duration": 20}, {"name": "Line Up / Edge Up", "price": 15, "duration": 15}, {"name": "Kids Haircut", "price": 18, "duration": 25}, {"name": "Senior Haircut", "price": 20, "duration": 30}, {"name": "Beard Trim", "price": 15, "duration": 15}, {"name": "Beard Shape & Line", "price": 20, "duration": 20}, {"name": "Hot Towel Shave", "price": 30, "duration": 30}, {"name": "Head Shave", "price": 25, "duration": 25}, {"name": "Haircut & Beard Combo", "price": 38, "duration": 45}, {"name": "Hair Design / Part", "price": 10, "duration": 10}, {"name": "Eyebrow Trim", "price": 8, "duration": 5}, {"name": "Nose/Ear Wax", "price": 10, "duration": 10}, {"name": "Gray Blending", "price": 20, "duration": 20}, {"name": "Hair Color", "price": 35, "duration": 45}, {"name": "Scalp Treatment", "price": 15, "duration": 15}]'::jsonb, true),

-- Massage pack
('Massage Therapy Services', (SELECT id FROM public.professions WHERE slug = 'massage'), 'Complete massage therapy menu', 
'["Swedish Massage", "Deep Tissue", "Hot Stone", "Sports Massage", "Prenatal"]'::jsonb,
'[{"name": "Swedish Massage - 60 min", "price": 80, "duration": 60}, {"name": "Swedish Massage - 90 min", "price": 110, "duration": 90}, {"name": "Deep Tissue - 60 min", "price": 90, "duration": 60}, {"name": "Deep Tissue - 90 min", "price": 125, "duration": 90}, {"name": "Hot Stone Massage - 60 min", "price": 100, "duration": 60}, {"name": "Hot Stone Massage - 90 min", "price": 140, "duration": 90}, {"name": "Sports Massage - 60 min", "price": 95, "duration": 60}, {"name": "Sports Massage - 90 min", "price": 130, "duration": 90}, {"name": "Prenatal Massage - 60 min", "price": 85, "duration": 60}, {"name": "Couples Massage - 60 min", "price": 160, "duration": 60}, {"name": "Aromatherapy Add-On", "price": 15, "duration": 0}, {"name": "CBD Oil Add-On", "price": 20, "duration": 0}, {"name": "Reflexology - 30 min", "price": 45, "duration": 30}, {"name": "Chair Massage - 15 min", "price": 25, "duration": 15}, {"name": "Lymphatic Drainage - 60 min", "price": 95, "duration": 60}, {"name": "Trigger Point Therapy", "price": 90, "duration": 60}, {"name": "Cupping Add-On", "price": 25, "duration": 15}, {"name": "Scalp Massage Add-On", "price": 15, "duration": 10}]'::jsonb, true),

-- Handyman pack
('Handyman Services', (SELECT id FROM public.professions WHERE slug = 'handyman'), 'Common handyman and home repair services', 
'["Furniture Assembly", "TV Mounting", "Drywall Repair", "Door Installation", "General Repairs"]'::jsonb,
'[{"name": "Furniture Assembly - Small", "price": 50, "duration": 60}, {"name": "Furniture Assembly - Large", "price": 100, "duration": 120}, {"name": "TV Wall Mounting", "price": 75, "duration": 60}, {"name": "TV Mounting w/ Wire Concealment", "price": 150, "duration": 120}, {"name": "Drywall Patch - Small", "price": 75, "duration": 60}, {"name": "Drywall Patch - Large", "price": 150, "duration": 120}, {"name": "Door Installation - Interior", "price": 150, "duration": 120}, {"name": "Door Installation - Exterior", "price": 250, "duration": 180}, {"name": "Lock Installation/Replace", "price": 75, "duration": 45}, {"name": "Deadbolt Installation", "price": 85, "duration": 60}, {"name": "Ceiling Fan Installation", "price": 100, "duration": 90}, {"name": "Light Fixture Installation", "price": 75, "duration": 60}, {"name": "Outlet/Switch Replace", "price": 50, "duration": 30}, {"name": "Faucet Installation", "price": 100, "duration": 90}, {"name": "Toilet Installation", "price": 150, "duration": 120}, {"name": "Garbage Disposal Install", "price": 125, "duration": 90}, {"name": "Tile Repair", "price": 100, "duration": 120}, {"name": "Caulking - Bathroom", "price": 75, "duration": 60}, {"name": "Weather Stripping", "price": 50, "duration": 45}, {"name": "Shelf Installation", "price": 60, "duration": 45}, {"name": "Picture/Mirror Hanging", "price": 40, "duration": 30}, {"name": "Smoke Detector Install", "price": 35, "duration": 20}, {"name": "Hourly Rate", "price": 65, "duration": 60}]'::jsonb, true),

-- Cleaning pack
('Professional Cleaning', (SELECT id FROM public.professions WHERE slug = 'cleaning'), 'Residential and commercial cleaning services', 
'["Standard Clean", "Deep Clean", "Move-In/Out", "Office Cleaning", "Post-Construction"]'::jsonb,
'[{"name": "Standard Clean - Studio/1BR", "price": 100, "duration": 120}, {"name": "Standard Clean - 2BR", "price": 130, "duration": 150}, {"name": "Standard Clean - 3BR", "price": 160, "duration": 180}, {"name": "Standard Clean - 4BR+", "price": 200, "duration": 240}, {"name": "Deep Clean - Studio/1BR", "price": 175, "duration": 180}, {"name": "Deep Clean - 2BR", "price": 225, "duration": 210}, {"name": "Deep Clean - 3BR", "price": 275, "duration": 240}, {"name": "Deep Clean - 4BR+", "price": 350, "duration": 300}, {"name": "Move-In/Out Clean - Studio/1BR", "price": 200, "duration": 240}, {"name": "Move-In/Out Clean - 2BR", "price": 275, "duration": 300}, {"name": "Move-In/Out Clean - 3BR", "price": 350, "duration": 360}, {"name": "Post-Construction Clean", "price": 400, "duration": 480}, {"name": "Office Cleaning - Small", "price": 150, "duration": 120}, {"name": "Office Cleaning - Medium", "price": 250, "duration": 180}, {"name": "Refrigerator Deep Clean", "price": 50, "duration": 45}, {"name": "Oven Deep Clean", "price": 40, "duration": 45}, {"name": "Window Cleaning (per window)", "price": 8, "duration": 10}, {"name": "Carpet Spot Treatment", "price": 25, "duration": 20}, {"name": "Laundry Service", "price": 30, "duration": 60}, {"name": "Organizing - Hourly", "price": 50, "duration": 60}]'::jsonb, true),

-- NEW: Tattoo Artist pack
('Tattoo Studio Services', (SELECT id FROM public.professions WHERE slug = 'tattoo_artist'), 'Complete tattoo artist service menu', 
'["Small Tattoo", "Medium Tattoo", "Large Tattoo", "Cover-Up", "Touch-Up"]'::jsonb,
'[{"name": "Consultation", "price": 0, "duration": 30}, {"name": "Small Tattoo (1-2 in)", "price": 80, "duration": 60}, {"name": "Medium Tattoo (3-5 in)", "price": 200, "duration": 120}, {"name": "Large Tattoo (6-10 in)", "price": 400, "duration": 240}, {"name": "Extra Large / Half Sleeve", "price": 800, "duration": 360}, {"name": "Full Sleeve - Session", "price": 350, "duration": 240}, {"name": "Back Piece - Session", "price": 400, "duration": 300}, {"name": "Cover-Up - Small", "price": 150, "duration": 90}, {"name": "Cover-Up - Medium", "price": 350, "duration": 180}, {"name": "Cover-Up - Large", "price": 600, "duration": 300}, {"name": "Touch-Up (own work)", "price": 0, "duration": 30}, {"name": "Touch-Up (other artist)", "price": 50, "duration": 45}, {"name": "Fine Line Work", "price": 150, "duration": 90}, {"name": "Watercolor Style", "price": 250, "duration": 150}, {"name": "Blackwork / Geometric", "price": 200, "duration": 120}, {"name": "Portrait - Small", "price": 300, "duration": 180}, {"name": "Portrait - Large", "price": 600, "duration": 360}, {"name": "Lettering / Script", "price": 100, "duration": 60}, {"name": "Custom Design Deposit", "price": 100, "duration": 0}, {"name": "Hourly Rate", "price": 150, "duration": 60}]'::jsonb, true),

-- NEW: Music Lessons pack
('Music Lesson Services', (SELECT id FROM public.professions WHERE slug = 'music_lessons'), 'Private music instruction services', 
'["Piano Lesson", "Guitar Lesson", "Voice Lesson", "Drums", "Music Theory"]'::jsonb,
'[{"name": "Piano Lesson - 30 min", "price": 35, "duration": 30}, {"name": "Piano Lesson - 45 min", "price": 50, "duration": 45}, {"name": "Piano Lesson - 60 min", "price": 65, "duration": 60}, {"name": "Guitar Lesson - 30 min", "price": 35, "duration": 30}, {"name": "Guitar Lesson - 45 min", "price": 50, "duration": 45}, {"name": "Guitar Lesson - 60 min", "price": 65, "duration": 60}, {"name": "Voice Lesson - 30 min", "price": 40, "duration": 30}, {"name": "Voice Lesson - 45 min", "price": 55, "duration": 45}, {"name": "Voice Lesson - 60 min", "price": 70, "duration": 60}, {"name": "Drum Lesson - 30 min", "price": 40, "duration": 30}, {"name": "Drum Lesson - 60 min", "price": 70, "duration": 60}, {"name": "Violin Lesson - 30 min", "price": 40, "duration": 30}, {"name": "Violin Lesson - 60 min", "price": 70, "duration": 60}, {"name": "Bass Guitar - 30 min", "price": 35, "duration": 30}, {"name": "Bass Guitar - 60 min", "price": 65, "duration": 60}, {"name": "Ukulele Lesson - 30 min", "price": 30, "duration": 30}, {"name": "Music Theory - 60 min", "price": 50, "duration": 60}, {"name": "Songwriting Session", "price": 75, "duration": 60}, {"name": "Recording Session Coaching", "price": 100, "duration": 90}, {"name": "Trial Lesson", "price": 25, "duration": 30}, {"name": "4-Lesson Package (30 min)", "price": 120, "duration": 120}, {"name": "4-Lesson Package (60 min)", "price": 220, "duration": 240}]'::jsonb, true),

-- NEW: Interior Design pack
('Interior Design Services', (SELECT id FROM public.professions WHERE slug = 'interior_design'), 'Professional interior design services', 
'["Room Design", "Color Consultation", "Space Planning", "Shopping Service", "Full Home Design"]'::jsonb,
'[{"name": "Initial Consultation", "price": 150, "duration": 90}, {"name": "Color Consultation", "price": 200, "duration": 120}, {"name": "Single Room Design", "price": 500, "duration": 300}, {"name": "Kitchen Design", "price": 800, "duration": 480}, {"name": "Bathroom Design", "price": 400, "duration": 240}, {"name": "Living Room Design", "price": 600, "duration": 360}, {"name": "Bedroom Design", "price": 450, "duration": 300}, {"name": "Home Office Design", "price": 400, "duration": 240}, {"name": "Open Floor Plan Design", "price": 1000, "duration": 600}, {"name": "Full Home Design Package", "price": 3500, "duration": 0}, {"name": "Space Planning - Per Room", "price": 250, "duration": 120}, {"name": "Furniture Selection", "price": 300, "duration": 180}, {"name": "Shopping/Sourcing - Hourly", "price": 75, "duration": 60}, {"name": "Project Management - Hourly", "price": 85, "duration": 60}, {"name": "Mood Board Creation", "price": 150, "duration": 120}, {"name": "3D Rendering - Per Room", "price": 350, "duration": 180}, {"name": "Lighting Design", "price": 300, "duration": 180}, {"name": "Window Treatment Design", "price": 200, "duration": 120}, {"name": "Art Curation", "price": 250, "duration": 180}, {"name": "Seasonal Refresh", "price": 400, "duration": 240}]'::jsonb, true),

-- NEW: Home Staging pack
('Home Staging Services', (SELECT id FROM public.professions WHERE slug = 'home_staging'), 'Real estate staging services', 
'["Consultation", "Vacant Staging", "Occupied Staging", "Photography Prep", "Model Home"]'::jsonb,
'[{"name": "Staging Consultation", "price": 200, "duration": 90}, {"name": "Walk & Talk - Quick Consult", "price": 100, "duration": 60}, {"name": "Occupied Staging - Partial", "price": 400, "duration": 180}, {"name": "Occupied Staging - Full Home", "price": 800, "duration": 360}, {"name": "Vacant Staging - 1BR/Studio", "price": 1500, "duration": 0}, {"name": "Vacant Staging - 2BR", "price": 2500, "duration": 0}, {"name": "Vacant Staging - 3BR", "price": 3500, "duration": 0}, {"name": "Vacant Staging - 4BR+", "price": 5000, "duration": 0}, {"name": "Luxury Property Staging", "price": 8000, "duration": 0}, {"name": "Model Home Staging", "price": 6000, "duration": 0}, {"name": "Photography Prep Only", "price": 300, "duration": 120}, {"name": "Monthly Rental - 1BR", "price": 500, "duration": 0}, {"name": "Monthly Rental - 2BR", "price": 750, "duration": 0}, {"name": "Monthly Rental - 3BR", "price": 1000, "duration": 0}, {"name": "De-Staging Service", "price": 200, "duration": 120}, {"name": "Curb Appeal Enhancement", "price": 350, "duration": 180}, {"name": "Virtual Staging - Per Photo", "price": 50, "duration": 0}, {"name": "Furniture Rental Extension", "price": 400, "duration": 0}]'::jsonb, true),

-- NEW: Notary Services pack
('Notary & Signing Services', (SELECT id FROM public.professions WHERE slug = 'notary_services'), 'Mobile notary and document signing services', 
'["General Notary", "Loan Signing", "Real Estate Closing", "Apostille", "Mobile Service"]'::jsonb,
'[{"name": "Standard Notarization", "price": 15, "duration": 15}, {"name": "Additional Signature", "price": 10, "duration": 5}, {"name": "Loan Signing - Refinance", "price": 150, "duration": 60}, {"name": "Loan Signing - Purchase", "price": 175, "duration": 75}, {"name": "Loan Signing - HELOC", "price": 125, "duration": 45}, {"name": "Loan Signing - Reverse Mortgage", "price": 200, "duration": 90}, {"name": "Real Estate Closing", "price": 175, "duration": 60}, {"name": "Seller Signing Package", "price": 100, "duration": 30}, {"name": "Power of Attorney", "price": 25, "duration": 20}, {"name": "Affidavit", "price": 20, "duration": 15}, {"name": "Will / Trust Signing", "price": 50, "duration": 30}, {"name": "Apostille Assistance", "price": 75, "duration": 30}, {"name": "I-9 Verification", "price": 25, "duration": 15}, {"name": "Mobile Service Fee (0-15 mi)", "price": 25, "duration": 0}, {"name": "Mobile Service Fee (15-30 mi)", "price": 50, "duration": 0}, {"name": "Mobile Service Fee (30+ mi)", "price": 75, "duration": 0}, {"name": "After Hours Fee", "price": 50, "duration": 0}, {"name": "Weekend/Holiday Fee", "price": 35, "duration": 0}, {"name": "Hospital/Jail Visit", "price": 100, "duration": 60}, {"name": "Witness Fee (per witness)", "price": 25, "duration": 0}]'::jsonb, true);
