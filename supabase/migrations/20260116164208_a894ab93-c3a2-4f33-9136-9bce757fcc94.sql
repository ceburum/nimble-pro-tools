-- Update all existing packs to price = $3.00 (300 cents)
UPDATE service_menu_library SET price_cents = 300;

-- Add 5 NEW service menu packs for professions that don't have packs yet
-- 1. Plumbing Services Pack
INSERT INTO service_menu_library (profession_id, title, description, preview_items, services, is_active, available_in_setup, is_featured, price_cents, created_by)
SELECT 
  id,
  'Professional Plumbing Services',
  'Complete plumbing service menu with 50 common plumbing services for residential and commercial',
  '["Leak Repair", "Faucet Installation", "Drain Cleaning", "Water Heater Repair"]'::jsonb,
  '[
    {"name": "Leak Repair", "price": 125, "duration": 60},
    {"name": "Faucet Installation", "price": 150, "duration": 90},
    {"name": "Faucet Repair", "price": 95, "duration": 45},
    {"name": "Toilet Installation", "price": 200, "duration": 120},
    {"name": "Toilet Repair", "price": 125, "duration": 60},
    {"name": "Drain Cleaning", "price": 150, "duration": 60},
    {"name": "Clogged Drain Repair", "price": 175, "duration": 90},
    {"name": "Water Heater Installation", "price": 500, "duration": 300},
    {"name": "Water Heater Repair", "price": 200, "duration": 120},
    {"name": "Garbage Disposal Install", "price": 175, "duration": 90},
    {"name": "Garbage Disposal Repair", "price": 125, "duration": 60},
    {"name": "Dishwasher Installation", "price": 175, "duration": 90},
    {"name": "Sink Installation", "price": 250, "duration": 150},
    {"name": "Sink Repair", "price": 125, "duration": 60},
    {"name": "Pipe Repair", "price": 150, "duration": 90},
    {"name": "Pipe Replacement", "price": 300, "duration": 180},
    {"name": "Sewer Line Cleaning", "price": 250, "duration": 120},
    {"name": "Water Line Repair", "price": 350, "duration": 180},
    {"name": "Sump Pump Installation", "price": 450, "duration": 240},
    {"name": "Shower Valve Repair", "price": 200, "duration": 120},
    {"name": "Bathtub Drain Repair", "price": 150, "duration": 90},
    {"name": "Camera Inspection", "price": 200, "duration": 60},
    {"name": "Emergency Plumbing", "price": 200, "duration": 60},
    {"name": "Plumbing Inspection", "price": 95, "duration": 60}
  ]'::jsonb,
  true,
  true,
  false,
  300,
  'system'
FROM professions WHERE slug = 'plumbing';

-- 2. Electrical Services Pack
INSERT INTO service_menu_library (profession_id, title, description, preview_items, services, is_active, available_in_setup, is_featured, price_cents, created_by)
SELECT 
  id,
  'Complete Electrical Services',
  'Professional electrical service menu with common residential and commercial electrical services',
  '["Outlet Installation", "Panel Upgrade", "Lighting Installation", "Ceiling Fan Install"]'::jsonb,
  '[
    {"name": "Outlet Installation", "price": 125, "duration": 45},
    {"name": "Outlet Repair", "price": 85, "duration": 30},
    {"name": "GFCI Outlet Installation", "price": 150, "duration": 60},
    {"name": "Switch Installation", "price": 95, "duration": 30},
    {"name": "Dimmer Switch Install", "price": 125, "duration": 45},
    {"name": "Smart Switch Installation", "price": 150, "duration": 60},
    {"name": "Light Fixture Installation", "price": 125, "duration": 60},
    {"name": "Chandelier Installation", "price": 200, "duration": 90},
    {"name": "Recessed Lighting", "price": 175, "duration": 90},
    {"name": "Track Lighting Install", "price": 200, "duration": 120},
    {"name": "Ceiling Fan Installation", "price": 175, "duration": 90},
    {"name": "Ceiling Fan Repair", "price": 95, "duration": 45},
    {"name": "Panel Upgrade", "price": 1500, "duration": 480},
    {"name": "Circuit Breaker Replacement", "price": 200, "duration": 60},
    {"name": "Electrical Inspection", "price": 150, "duration": 90},
    {"name": "Wiring Repair", "price": 250, "duration": 120},
    {"name": "Whole House Surge Protector", "price": 350, "duration": 120},
    {"name": "Generator Installation", "price": 500, "duration": 240},
    {"name": "EV Charger Installation", "price": 750, "duration": 300},
    {"name": "Smoke Detector Installation", "price": 75, "duration": 30},
    {"name": "Carbon Monoxide Detector", "price": 75, "duration": 30},
    {"name": "Outdoor Lighting Install", "price": 200, "duration": 120},
    {"name": "Motion Sensor Light", "price": 150, "duration": 60},
    {"name": "Emergency Electrical Service", "price": 200, "duration": 60}
  ]'::jsonb,
  true,
  true,
  false,
  300,
  'system'
FROM professions WHERE slug = 'electrical';

-- 3. Landscaping Services Pack
INSERT INTO service_menu_library (profession_id, title, description, preview_items, services, is_active, available_in_setup, is_featured, price_cents, created_by)
SELECT 
  id,
  'Full Landscaping Services',
  'Complete landscaping menu from lawn care to hardscape installation',
  '["Lawn Mowing", "Tree Trimming", "Mulch Installation", "Patio Design"]'::jsonb,
  '[
    {"name": "Lawn Mowing", "price": 45, "duration": 60},
    {"name": "Lawn Edging", "price": 35, "duration": 30},
    {"name": "Hedge Trimming", "price": 75, "duration": 60},
    {"name": "Tree Trimming", "price": 150, "duration": 120},
    {"name": "Tree Removal", "price": 500, "duration": 300},
    {"name": "Stump Grinding", "price": 200, "duration": 120},
    {"name": "Mulch Installation", "price": 150, "duration": 120},
    {"name": "Flower Bed Design", "price": 250, "duration": 180},
    {"name": "Plant Installation", "price": 100, "duration": 60},
    {"name": "Shrub Installation", "price": 125, "duration": 90},
    {"name": "Sod Installation", "price": 500, "duration": 360},
    {"name": "Lawn Aeration", "price": 150, "duration": 90},
    {"name": "Overseeding", "price": 125, "duration": 60},
    {"name": "Fertilization", "price": 75, "duration": 45},
    {"name": "Weed Control", "price": 85, "duration": 60},
    {"name": "Irrigation Installation", "price": 1500, "duration": 480},
    {"name": "Sprinkler Repair", "price": 125, "duration": 60},
    {"name": "Patio Design", "price": 500, "duration": 240},
    {"name": "Retaining Wall", "price": 2000, "duration": 960},
    {"name": "Walkway Installation", "price": 750, "duration": 360},
    {"name": "Outdoor Lighting", "price": 300, "duration": 180},
    {"name": "Drainage Solutions", "price": 400, "duration": 240},
    {"name": "Spring Cleanup", "price": 200, "duration": 180},
    {"name": "Fall Cleanup", "price": 200, "duration": 180}
  ]'::jsonb,
  true,
  true,
  false,
  300,
  'system'
FROM professions WHERE slug = 'landscaping';

-- 4. Lawn Care Services Pack
INSERT INTO service_menu_library (profession_id, title, description, preview_items, services, is_active, available_in_setup, is_featured, price_cents, created_by)
SELECT 
  id,
  'Lawn Care Services',
  'Focused lawn maintenance and care services for residential properties',
  '["Weekly Mowing", "Lawn Treatment", "Leaf Removal", "Snow Removal"]'::jsonb,
  '[
    {"name": "Weekly Lawn Mowing", "price": 40, "duration": 45},
    {"name": "Bi-Weekly Mowing", "price": 50, "duration": 60},
    {"name": "One-Time Mowing", "price": 60, "duration": 60},
    {"name": "Lawn Edging", "price": 25, "duration": 20},
    {"name": "String Trimming", "price": 30, "duration": 25},
    {"name": "Blowing/Cleanup", "price": 20, "duration": 15},
    {"name": "Lawn Fertilization", "price": 75, "duration": 45},
    {"name": "Weed Treatment", "price": 65, "duration": 45},
    {"name": "Grub Control", "price": 85, "duration": 60},
    {"name": "Lawn Aeration", "price": 125, "duration": 90},
    {"name": "Overseeding", "price": 100, "duration": 60},
    {"name": "Dethatching", "price": 150, "duration": 120},
    {"name": "Leaf Removal", "price": 125, "duration": 120},
    {"name": "Gutter Cleaning", "price": 100, "duration": 90},
    {"name": "Hedge Trimming", "price": 75, "duration": 60},
    {"name": "Shrub Pruning", "price": 60, "duration": 45},
    {"name": "Mulch Delivery", "price": 100, "duration": 30},
    {"name": "Mulch Spreading", "price": 150, "duration": 120},
    {"name": "Snow Removal - Driveway", "price": 50, "duration": 30},
    {"name": "Snow Removal - Walkway", "price": 30, "duration": 20},
    {"name": "Salt Application", "price": 40, "duration": 15},
    {"name": "Spring Cleanup", "price": 175, "duration": 180},
    {"name": "Fall Cleanup", "price": 175, "duration": 180},
    {"name": "Monthly Maintenance Plan", "price": 150, "duration": 90}
  ]'::jsonb,
  true,
  true,
  false,
  300,
  'system'
FROM professions WHERE slug = 'lawn_care';

-- 5. Pet Grooming Services Pack
INSERT INTO service_menu_library (profession_id, title, description, preview_items, services, is_active, available_in_setup, is_featured, price_cents, created_by)
SELECT 
  id,
  'Pet Grooming Services',
  'Complete pet grooming menu for dogs, cats, and small animals',
  '["Full Groom", "Bath & Brush", "Nail Trim", "De-Shedding"]'::jsonb,
  '[
    {"name": "Full Groom - Small Dog", "price": 55, "duration": 90},
    {"name": "Full Groom - Medium Dog", "price": 70, "duration": 120},
    {"name": "Full Groom - Large Dog", "price": 95, "duration": 150},
    {"name": "Full Groom - Cat", "price": 75, "duration": 120},
    {"name": "Bath & Brush - Small Dog", "price": 35, "duration": 45},
    {"name": "Bath & Brush - Medium Dog", "price": 45, "duration": 60},
    {"name": "Bath & Brush - Large Dog", "price": 60, "duration": 75},
    {"name": "Puppy First Groom", "price": 45, "duration": 60},
    {"name": "Senior Pet Groom", "price": 65, "duration": 90},
    {"name": "De-Shedding Treatment", "price": 35, "duration": 45},
    {"name": "Nail Trim", "price": 15, "duration": 15},
    {"name": "Nail Grinding", "price": 20, "duration": 20},
    {"name": "Ear Cleaning", "price": 15, "duration": 15},
    {"name": "Teeth Brushing", "price": 10, "duration": 10},
    {"name": "Flea Bath", "price": 40, "duration": 45},
    {"name": "Medicated Bath", "price": 50, "duration": 60},
    {"name": "Sanitary Trim", "price": 15, "duration": 15},
    {"name": "Paw Pad Trim", "price": 10, "duration": 10},
    {"name": "Face Trim", "price": 15, "duration": 15},
    {"name": "Breed Specific Cut", "price": 65, "duration": 90},
    {"name": "Creative Styling", "price": 85, "duration": 120},
    {"name": "Cologne Spritz", "price": 5, "duration": 5},
    {"name": "Blueberry Facial", "price": 15, "duration": 15},
    {"name": "Spa Package", "price": 100, "duration": 120}
  ]'::jsonb,
  true,
  true,
  false,
  300,
  'system'
FROM professions WHERE slug = 'pet_grooming';