-- Create pool_settings table for storing pool rules and configuration
CREATE TABLE IF NOT EXISTS pool_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE pool_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the settings
CREATE POLICY "Allow read access to pool settings"
  ON pool_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow authenticated users to update (you'll need to be logged in as admin)
CREATE POLICY "Allow update access to pool settings"
  ON pool_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow insert for initial setup
CREATE POLICY "Allow insert pool settings"
  ON pool_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default row
INSERT INTO pool_settings (id, rules)
VALUES (1, 'Pool rules will be set by your administrator.')
ON CONFLICT (id) DO NOTHING;
