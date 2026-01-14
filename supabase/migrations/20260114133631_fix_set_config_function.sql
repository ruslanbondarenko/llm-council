/*
  # Fix set_config function recursion issue
  
  ## Changes
  
  1. Drop and recreate `set_config` function
    - Fix infinite recursion by calling `pg_catalog.set_config` instead
    - Function properly sets session variables for RLS policies
  
  2. Security
    - Maintains SECURITY DEFINER for proper permissions
    - Only allows setting `app.*` config variables
*/

-- Drop existing function
DROP FUNCTION IF EXISTS set_config(text, text);

-- Create corrected function
CREATE OR REPLACE FUNCTION set_config(setting text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF setting LIKE 'app.%' THEN
    PERFORM pg_catalog.set_config(setting, value, false);
  ELSE
    RAISE EXCEPTION 'Only app.* settings are allowed';
  END IF;
END;
$$;
