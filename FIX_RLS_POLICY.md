# 🔴 CRITICAL: Fix Row Level Security to Sync Games

## The Problem
**ALL game syncs are failing** because of Supabase Row Level Security (RLS) policies blocking inserts.

Error message: `"new row violates row-level security policy for table "games""`

## ✅ Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

Copy and paste this EXACT SQL code:

```sql
-- First, drop any existing restrictive policies
DROP POLICY IF EXISTS "games_insert_policy" ON public.games;
DROP POLICY IF EXISTS "games_update_policy" ON public.games;
DROP POLICY IF EXISTS "games_delete_policy" ON public.games;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.games;

-- Allow service role (backend API) to manage games
CREATE POLICY "service_role_all_games" 
ON public.games
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read games
CREATE POLICY "authenticated_read_games" 
ON public.games
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to read games (for public viewing)
CREATE POLICY "anon_read_games" 
ON public.games
FOR SELECT
TO anon
USING (true);
```

### Step 3: Click "Run" button

You should see: "Success. No rows returned"

## Test It Works

1. Go to http://localhost:3000/admin
2. Click "Sync Games" with Week 10, 2024
3. You should see: **"✅ Success! Synced 14-16 games for Week 10, 2024"**
4. Click "Check Database" - should show games count > 0
5. Go to http://localhost:3000/picks - games should appear!

## What Changed

### Before (Broken)
- ❌ RLS blocked ALL inserts to games table
- ❌ Sync API couldn't add games
- ❌ No games displayed anywhere

### After (Fixed)  
- ✅ Service role (API) can insert/update/delete games
- ✅ Authenticated users can read games
- ✅ Anonymous users can view games (optional)
- ✅ Games sync successfully
- ✅ Picks page shows games!

## Verify Everything Works

After running the SQL, you should have:

1. **Admin Page** (`/admin`):
   - Click "Check Database" → shows game count
   - Shows "Games by Week" section
   - Week 10, 2024 should have ~14 games

2. **Picks Page** (`/picks`):
   - Shows clickable team cards
   - Can select picks by clicking team logos
   - Shows scores for completed games
   - Lock icon for started games

3. **Schedule Page** (`/schedule`):
   - Shows all games with scores
   - Live games have red pulse
   - Week selector works

## Common Issues

### Issue: Still no games after running SQL
**Solution**: Sync again from Admin page - previous syncs failed, you need to re-sync

### Issue: "No games for week X"  
**Solution**: Use Week 10, 2024 (has completed games) or sync the current week first

### Issue: Can't see picks
**Solution**: Make sure you:
1. Synced games successfully
2. Are on the correct week (use week selector arrows)
3. Check admin page to confirm games exist

## How the App Now Works

1. **Syncing**: Admin page → Sync Games → ESPN API → Supabase
2. **Viewing**: Picks/Schedule pages query Supabase → Show games
3. **Making Picks**: Click team logo → Save to database
4. **Real-time**: When games update, scores refresh automatically

---

## Alternative: Disable RLS Entirely (Not Recommended)

Only use this for quick testing:

```sql
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: This removes all access control. Use the proper policies above instead.

---

After running the SQL, **refresh your browser** and try syncing again! 🎉
