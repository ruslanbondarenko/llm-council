/*
  # Fix RLS Session Handling
  
  ## Changes
  
  1. Update set_config function to use proper permissions
    - Function properly sets PostgreSQL session config variables
    - Uses SECURITY DEFINER with proper validation
  
  2. Update RLS policies to handle session_id correctly
    - Check if session_id is set before comparing
    - Gracefully handle cases where session is not set
  
  3. Important Notes
    - Policies now validate that session_id exists and matches
    - Client must call set_config before any database operations
*/

-- Recreate set_config function with proper implementation
DROP FUNCTION IF EXISTS set_config(text, text);

CREATE OR REPLACE FUNCTION set_config(key text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF key LIKE 'app.%' THEN
    EXECUTE format('SELECT set_config(%L, %L, false)', key, value);
  ELSE
    RAISE EXCEPTION 'Only app.* settings are allowed';
  END IF;
END;
$$;

-- Helper function to get current session_id
CREATE OR REPLACE FUNCTION get_session_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  session_value text;
BEGIN
  session_value := current_setting('app.session_id', true);
  IF session_value IS NULL OR session_value = '' THEN
    RETURN NULL;
  END IF;
  RETURN session_value::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations with valid session" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

-- Create new policies using helper function

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (session_id = get_session_id());

CREATE POLICY "Users can create conversations with valid session"
  ON conversations FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id = get_session_id()
  );

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (session_id = get_session_id())
  WITH CHECK (session_id = get_session_id());

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (session_id = get_session_id());

-- Messages policies

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = get_session_id()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = get_session_id()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = get_session_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = get_session_id()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = get_session_id()
    )
  );
