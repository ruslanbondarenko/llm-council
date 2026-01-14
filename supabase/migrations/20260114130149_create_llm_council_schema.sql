/*
  # LLM Council Database Schema

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key) - Unique conversation identifier
      - `created_at` (timestamptz) - When the conversation was created
      - `title` (text) - Auto-generated title from first message
      - `message_count` (integer) - Number of messages in conversation
    
    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `conversation_id` (uuid, foreign key) - References conversations table
      - `role` (text) - Either 'user' or 'assistant'
      - `content` (text) - User message content (for user messages)
      - `stage1_responses` (jsonb) - Array of individual model responses (for assistant messages)
      - `stage2_rankings` (jsonb) - Array of peer rankings (for assistant messages)
      - `stage3_final` (text) - Final synthesized response (for assistant messages)
      - `metadata` (jsonb) - Additional metadata (label_to_model, aggregate_rankings)
      - `created_at` (timestamptz) - When the message was created
  
  2. Security
    - Enable RLS on all tables
    - Public access policies (no authentication required for this demo app)
    - Users can read and create conversations and messages

  3. Important Notes
    - RLS is enabled but allows public access since this is a demo application
    - In production, you would add authentication and restrict access by user_id
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text DEFAULT 'New Conversation',
  message_count integer DEFAULT 0
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text,
  stage1_responses jsonb,
  stage2_rankings jsonb,
  stage3_final text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo app - no auth required)
CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update messages"
  ON messages FOR UPDATE
  USING (true)
  WITH CHECK (true);