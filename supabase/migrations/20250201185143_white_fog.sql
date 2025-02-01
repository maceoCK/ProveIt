/*
  # Create todos table for task management

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `task` (text)
      - `deadline` (timestamptz)
      - `stake` (decimal)
      - `completed` (boolean)
      - `evidence` (text)
      - `verified` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `todos` table
    - Add policies for:
      - Users to manage their own todos
      - Admins to view and verify todos
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  task text NOT NULL,
  deadline timestamptz NOT NULL,
  stake decimal NOT NULL,
  completed boolean DEFAULT false,
  evidence text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Users can read their own todos
CREATE POLICY "Users can read own todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own todos
CREATE POLICY "Users can insert own todos"
  ON todos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own todos
CREATE POLICY "Users can update own todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all todos
CREATE POLICY "Admins can view all todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@admin.com');

-- Admins can verify todos
CREATE POLICY "Admins can verify todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@admin.com')
  WITH CHECK (
    auth.jwt() ->> 'email' LIKE '%@admin.com' AND
    (OLD.verified IS DISTINCT FROM NEW.verified)
  );