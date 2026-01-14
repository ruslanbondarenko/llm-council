/*
  # Add set_config helper function
  
  ## Changes
  
  1. Create `set_config` function
    - Allows setting session variables from client-side code
    - Used for setting `app.session_id` for RLS policies
    - Returns void (no return value)
  
  2. Security
    - Function runs with SECURITY DEFINER to allow setting config
    - Only allows setting `app.*` config variables for safety
    - Validates input parameters
*/

-- Create function to set session config variables
CREATE OR REPLACE FUNCTION set_config(setting text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow setting app.* variables for security
  IF setting LIKE 'app.%' THEN
    PERFORM set_config(setting, value, false);
  ELSE
    RAISE EXCEPTION 'Only app.* settings are allowed';
  END IF;
END;
$$;