-- Migration to fix image column constraint in Supabase
-- Execute this in your Supabase SQL Editor

-- Check current column definition
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image';

-- Alter the image column to TEXT to allow longer base64 strings
ALTER TABLE products 
ALTER COLUMN image TYPE TEXT;

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image';

-- Optional: Check if there are any other VARCHAR(500) constraints
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE character_maximum_length = 500;