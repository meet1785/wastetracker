-- ============================================================
-- FreshTrack Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  dietary_preferences JSONB DEFAULT '[]',
  points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  money_saved DECIMAL(10,2) DEFAULT 0.00,
  last_active DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Other',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'units',
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  storage_type VARCHAR(50) DEFAULT 'Refrigerator',
  barcode VARCHAR(100),
  brand VARCHAR(255),
  image_url TEXT,
  estimated_cost DECIMAL(10,2),
  is_consumed BOOLEAN DEFAULT FALSE,
  is_wasted BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WASTE LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  estimated_cost DECIMAL(10,2),
  reason VARCHAR(100) CHECK (reason IN ('expired', 'spoiled', 'over_purchased', 'disliked', 'other')),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',
  prep_time INTEGER DEFAULT 0,
  cook_time INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 2,
  dietary_tags JSONB DEFAULT '[]',
  image_url TEXT,
  calories INTEGER,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SAVED RECIPES (user bookmarks)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_recipes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

-- ============================================================
-- SHOPPING LIST
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(50),
  is_purchased BOOLEAN DEFAULT FALSE,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  post_type VARCHAR(20) DEFAULT 'give' CHECK (post_type IN ('give', 'sell', 'trade')),
  price DECIMAL(10,2),
  location VARCHAR(255),
  is_available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  contact_info VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- GAMIFICATION BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  points_required INTEGER DEFAULT 0,
  badge_type VARCHAR(50) CHECK (badge_type IN ('points', 'streak', 'items_saved', 'recipes_used'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_user_expiry ON inventory_items(user_id, expiry_date) WHERE NOT is_consumed AND NOT is_wasted;
CREATE INDEX IF NOT EXISTS idx_waste_logs_user_id ON waste_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_logged_at ON waste_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type, is_available);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED BADGES
-- ============================================================
INSERT INTO badges (name, description, icon, points_required, badge_type) VALUES
  ('First Save', 'Saved your first item from waste', '🌱', 0, 'items_saved'),
  ('Eco Warrior', 'Saved 10 items from waste', '♻️', 0, 'items_saved'),
  ('Zero Waste Hero', 'Saved 50 items from waste', '🦸', 0, 'items_saved'),
  ('Week Streak', 'Logged in 7 days in a row', '🔥', 0, 'streak'),
  ('Month Streak', 'Logged in 30 days in a row', '💎', 0, 'streak'),
  ('Point Starter', 'Earned 100 points', '⭐', 100, 'points'),
  ('Point Master', 'Earned 500 points', '🏆', 500, 'points'),
  ('Chef Mode', 'Used 5 AI-suggested recipes', '👨‍🍳', 0, 'recipes_used')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED SAMPLE RECIPES
-- ============================================================
INSERT INTO recipes (name, description, ingredients, instructions, prep_time, cook_time, servings, dietary_tags, calories, difficulty) VALUES
(
  'Quick Veggie Stir Fry',
  'A fast and healthy stir fry using whatever vegetables you have on hand.',
  '[{"name":"Mixed vegetables","quantity":"2 cups","optional":false},{"name":"Soy sauce","quantity":"2 tbsp","optional":false},{"name":"Garlic","quantity":"2 cloves","optional":false},{"name":"Sesame oil","quantity":"1 tbsp","optional":true},{"name":"Rice","quantity":"1 cup","optional":true}]',
  '["Heat oil in a wok or large pan over high heat.","Add minced garlic and stir for 30 seconds.","Add vegetables in order of hardness (carrots first, leafy greens last).","Drizzle soy sauce and sesame oil, toss to coat.","Serve immediately over rice."]',
  10, 15, 2, '["vegetarian","vegan","quick"]', 320, 'easy'
),
(
  'Leftover Fried Rice',
  'Transform leftover rice and vegetables into a delicious fried rice.',
  '[{"name":"Cooked rice","quantity":"2 cups","optional":false},{"name":"Eggs","quantity":"2","optional":false},{"name":"Mixed vegetables","quantity":"1 cup","optional":false},{"name":"Soy sauce","quantity":"3 tbsp","optional":false},{"name":"Sesame oil","quantity":"1 tsp","optional":true}]',
  '["Beat eggs and scramble in hot oiled pan, set aside.","Add vegetables and stir fry for 2 minutes.","Add cold rice and break up clumps.","Mix in soy sauce and scrambled eggs.","Drizzle with sesame oil and serve hot."]',
  5, 10, 2, '["quick","budget-friendly"]', 410, 'easy'
),
(
  'Banana Oat Pancakes',
  'Use overripe bananas to make fluffy, naturally sweet pancakes.',
  '[{"name":"Overripe bananas","quantity":"2","optional":false},{"name":"Oats","quantity":"1 cup","optional":false},{"name":"Eggs","quantity":"2","optional":false},{"name":"Milk","quantity":"¼ cup","optional":false},{"name":"Cinnamon","quantity":"½ tsp","optional":true}]',
  '["Blend bananas, oats, eggs, and milk until smooth.","Let batter rest 5 minutes.","Heat non-stick pan over medium heat and lightly grease.","Pour ¼ cup batter per pancake.","Cook 2-3 minutes per side until golden. Serve with honey."]',
  5, 15, 2, '["vegetarian","gluten-free"]', 280, 'easy'
),
(
  'Creamy Tomato Soup',
  'A comforting soup made from fresh or canned tomatoes.',
  '[{"name":"Tomatoes","quantity":"6 medium","optional":false},{"name":"Onion","quantity":"1 large","optional":false},{"name":"Garlic","quantity":"3 cloves","optional":false},{"name":"Vegetable broth","quantity":"2 cups","optional":false},{"name":"Heavy cream","quantity":"¼ cup","optional":true},{"name":"Basil","quantity":"handful","optional":true}]',
  '["Sauté diced onion and garlic until soft.","Add chopped tomatoes and broth. Simmer 20 minutes.","Blend until smooth using an immersion blender.","Stir in cream and season with salt, pepper, and basil.","Serve with crusty bread."]',
  10, 25, 4, '["vegetarian","gluten-free"]', 190, 'medium'
),
(
  'Apple Cinnamon Oatmeal',
  'A warming breakfast using apples that are starting to soften.',
  '[{"name":"Apples","quantity":"2","optional":false},{"name":"Rolled oats","quantity":"1 cup","optional":false},{"name":"Milk or water","quantity":"2 cups","optional":false},{"name":"Cinnamon","quantity":"1 tsp","optional":false},{"name":"Honey","quantity":"2 tbsp","optional":true}]',
  '["Dice apples and cook in a saucepan with cinnamon and 2 tbsp water for 5 minutes.","Add oats and milk/water, bring to a boil.","Reduce heat and simmer 5 minutes, stirring occasionally.","Stir in honey and top with stewed apples.","Serve warm."]',
  5, 15, 2, '["vegetarian","vegan","breakfast"]', 350, 'easy'
)
ON CONFLICT DO NOTHING;
