-- Add business_data JSON column to business_profiles
-- This will store all company/business information
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS business_data JSONB DEFAULT '{}'::jsonb;

-- Create index for business_data queries
CREATE INDEX IF NOT EXISTS business_profiles_business_data_idx 
ON business_profiles USING gin(business_data);

-- Update existing records to migrate data to business_data JSON
-- This preserves any existing data in old columns
UPDATE business_profiles 
SET business_data = jsonb_build_object(
  'companyName', COALESCE(company_name, ''),
  'phone', COALESCE(phone, ''),
  'email', COALESCE(email, ''),
  'website', COALESCE(website, ''),
  'address', jsonb_build_object(
    'street', COALESCE(address, ''),
    'city', COALESCE(city, ''),
    'state', COALESCE(state, ''),
    'postalCode', COALESCE(postal_code, ''),
    'country', COALESCE(country, '')
  ),
  'tax', jsonb_build_object(
    'gst', COALESCE(gst, ''),
    'pan', COALESCE(pan, '')
  ),
  'logo', COALESCE(logo_url, ''),
  'bankDetails', '{}'::jsonb
)
WHERE business_data = '{}'::jsonb OR business_data IS NULL;

-- Note: Old columns can be kept for backward compatibility or dropped later
-- To drop old columns (optional, uncomment if needed):
-- ALTER TABLE business_profiles DROP COLUMN IF EXISTS company_name;
-- ALTER TABLE business_profiles DROP COLUMN IF EXISTS phone;
-- etc.
