-- Add quotation numbering configuration to organizations
-- This allows companies to set an optional starting number for quotations

-- Add quotation_start_number to org_data JSONB
-- This will be stored in the org_data JSON structure as an optional field

-- Update any existing organizations to ensure org_data exists
UPDATE organizations 
SET org_data = COALESCE(org_data, '{}'::jsonb)
WHERE org_data IS NULL;

-- Note: The quotation_start_number will be stored in org_data as:
-- {
--   ...existing fields...,
--   "quotationNumbering": {
--     "startNumber": 1001,  -- optional, defaults to 1 if not set
--     "prefix": "QT-",      -- optional prefix for quotation numbers
--     "currentNumber": 1001 -- tracks the next number to use
--   }
-- }

-- Create a function to get the next quotation number for an organization
CREATE OR REPLACE FUNCTION get_next_quotation_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_data jsonb;
  start_num integer;
  current_num integer;
  prefix text;
  next_num integer;
  quotation_number text;
BEGIN
  -- Get current org_data
  SELECT org_data INTO current_data
  FROM organizations
  WHERE id = org_id;

  -- Extract numbering configuration
  start_num := COALESCE((current_data->'quotationNumbering'->>'startNumber')::integer, 1);
  current_num := COALESCE((current_data->'quotationNumbering'->>'currentNumber')::integer, start_num);
  prefix := COALESCE(current_data->'quotationNumbering'->>'prefix', 'QT-');

  -- Calculate next number
  next_num := current_num;

  -- Update the current number for next time
  current_data := jsonb_set(
    COALESCE(current_data, '{}'::jsonb),
    '{quotationNumbering,currentNumber}',
    to_jsonb(current_num + 1)
  );

  -- Save updated data
  UPDATE organizations
  SET org_data = current_data
  WHERE id = org_id;

  -- Return formatted quotation number
  quotation_number := prefix || next_num::text;
  
  RETURN quotation_number;
END;
$$;

-- Add quotation_number column to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS quotation_number text;

-- Create index for quotation number lookups
CREATE INDEX IF NOT EXISTS quotations_quotation_number_idx 
ON quotations(quotation_number);

-- Add unique constraint per organization
CREATE UNIQUE INDEX IF NOT EXISTS quotations_org_number_unique 
ON quotations(organization_id, quotation_number);
