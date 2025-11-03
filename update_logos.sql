-- Update all team logos to use ESPN's CDN
-- This provides high-quality, official NFL team logos
-- Run this SQL in your Supabase SQL Editor

UPDATE teams 
SET logo_url = CONCAT('https://a.espncdn.com/i/teamlogos/nfl/500/', id, '.png')
WHERE id IN (
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
);

-- Verify the update
SELECT id, name, logo_url FROM teams ORDER BY name;
