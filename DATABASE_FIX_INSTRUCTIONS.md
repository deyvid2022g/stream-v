# Database Schema Fix Instructions

## Problem
The application is encountering a `value too long for type character varying(500)` error when trying to update products with base64 image data. This indicates that the `image` column in the Supabase database has a VARCHAR(500) constraint, while the local schema file shows it as TEXT.

## Root Cause
There's a mismatch between the local schema file (`supabase-schema.sql`) and the actual Supabase database schema. The database was likely created with an older version of the schema or wasn't properly updated.

## Solution

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Execute the Fix
Copy and paste the contents of `fix-image-column.sql` into the SQL Editor and execute it:

```sql
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
```

### Step 3: Verify the Fix
After executing the migration:
1. The first query should show `character varying` with length 500
2. After the ALTER statement, the third query should show `text` with no length limit
3. Try updating a product with an image in your application

### Step 4: Prevent Future Issues
To ensure your database schema stays in sync:
1. Always apply schema changes through the Supabase SQL Editor
2. Keep your local `supabase-schema.sql` file updated
3. Consider using Supabase migrations for version control

## Alternative: Complete Schema Reset (if needed)
If you encounter other schema mismatches, you can reset the entire database:

1. **⚠️ WARNING: This will delete all data!**
2. Execute the DROP statements from `supabase-migration-guide.sql`
3. Execute the complete `supabase-schema.sql` file
4. Re-insert any necessary data

## Testing
After applying the fix, test by:
1. Going to the Admin panel
2. Editing a product
3. Adding or changing an image
4. Saving the product

The error should no longer occur.