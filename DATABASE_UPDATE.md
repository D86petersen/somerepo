# Database Update - Add Unique Constraint for Games

Run this SQL in your Supabase SQL Editor to prevent duplicate games:

```sql
-- Add unique constraint to games table to prevent duplicates
-- This ensures each game (same week, season, home team, away team) can only exist once
ALTER TABLE public.games 
ADD CONSTRAINT games_unique_matchup 
UNIQUE (week, season, home_team_id, away_team_id);
```

This constraint allows the sync-games API to update existing games instead of creating duplicates.
