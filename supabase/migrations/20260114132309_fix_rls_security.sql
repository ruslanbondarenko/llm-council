/*
  # Fix RLS Security Issues
  
  ## Changes
  
  1. Schema Updates
    - Add `session_id` column to `conversations` table for user isolation
    - Add index on `session_id` for performance
  
  2. Security Improvements
    - **DROP** all existing insecure policies that use `USING (true)`
    - **CREATE** restrictive policies that enforce session-based isolation
    - Users can only view/modify their own conversations (based on session_id)
    - Messages inherit access control through conversation ownership
  
  3. Policy Details
    - **SELECT**: Users can only view conversations/messages they own
    - **INSERT**: New conversations require valid session_id; messages must belong to owned conversations
    - **UPDATE**: Users can only update their own conversations/messages
    - **DELETE**: Users can only delete their own data
  
  4. Important Notes
    - Session-based isolation provides security without requiring full authentication
    - Client generates session_id (UUID) and stores in localStorage
    - Each user's data is completely isolated from others
    - No more unrestricted access (no more `true` policies)
*/

-- Add session_id column to conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN session_id uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Create index for session_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);

-- Drop all insecure policies
DROP POLICY IF EXISTS "Anyone can view conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON messages;

-- Create secure policies for conversations table

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (session_id = current_setting('app.session_id', true)::uuid);

CREATE POLICY "Users can create conversations with valid session"
  ON conversations FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id = current_setting('app.session_id', true)::uuid
  );

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (session_id = current_setting('app.session_id', true)::uuid)
  WITH CHECK (session_id = current_setting('app.session_id', true)::uuid);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (session_id = current_setting('app.session_id', true)::uuid);

-- Create secure policies for messages table

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = current_setting('app.session_id', true)::uuid
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = current_setting('app.session_id', true)::uuid
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = current_setting('app.session_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = current_setting('app.session_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id = current_setting('app.session_id', true)::uuid
    )
  );