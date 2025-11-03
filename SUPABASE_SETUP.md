# Supabase Setup Guide for NFL Pool App

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: NFL Pool App (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your users
4. Click **"Create new project"** and wait 1-2 minutes for setup

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Configure Your Local Environment

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

3. Save the file

## Step 4: Create Database Tables

In your Supabase dashboard, go to **SQL Editor** and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week INTEGER NOT NULL,
  season INTEGER NOT NULL DEFAULT 2025,
  home_team_id TEXT REFERENCES public.teams(id) NOT NULL,
  away_team_id TEXT REFERENCES public.teams(id) NOT NULL,
  game_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('upcoming', 'live', 'final')) DEFAULT 'upcoming',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  quarter TEXT,
  time_remaining TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User picks table
CREATE TABLE public.picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  selected_team_id TEXT REFERENCES public.teams(id),
  tie_breaker INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Standings view (calculated from picks and game results)
CREATE OR REPLACE VIEW public.standings AS
SELECT 
  p.user_id,
  prof.full_name,
  prof.email,
  COUNT(CASE 
    WHEN g.status = 'final' AND (
      (pk.selected_team_id = g.home_team_id AND g.home_score > g.away_score) OR
      (pk.selected_team_id = g.away_team_id AND g.away_score > g.home_score)
    ) THEN 1 
  END) as score
FROM public.profiles p
LEFT JOIN public.picks pk ON p.id = pk.user_id
LEFT JOIN public.games g ON pk.game_id = g.id
LEFT JOIN public.profiles prof ON p.id = prof.id
GROUP BY p.user_id, prof.full_name, prof.email
ORDER BY score DESC;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Teams policies (read-only for all authenticated users)
CREATE POLICY "Teams are viewable by authenticated users"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

-- Games policies (read-only for all authenticated users)
CREATE POLICY "Games are viewable by authenticated users"
  ON public.games FOR SELECT
  TO authenticated
  USING (true);

-- Picks policies
CREATE POLICY "Users can view all picks"
  ON public.picks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own picks"
  ON public.picks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own picks before game starts"
  ON public.picks FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = picks.game_id
      AND games.game_time > NOW()
    )
  );

CREATE POLICY "Users can delete own picks before game starts"
  ON public.picks FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = picks.game_id
      AND games.game_time > NOW()
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 5: Seed Initial Data (NFL Teams)

Run this SQL to populate the teams table:

```sql
INSERT INTO public.teams (id, name, logo_url) VALUES
  ('ARI', 'Arizona Cardinals', '/logos/ARI.svg'),
  ('ATL', 'Atlanta Falcons', '/logos/ATL.svg'),
  ('BAL', 'Baltimore Ravens', '/logos/BAL.svg'),
  ('BUF', 'Buffalo Bills', '/logos/BUF.svg'),
  ('CAR', 'Carolina Panthers', '/logos/CAR.svg'),
  ('CHI', 'Chicago Bears', '/logos/CHI.svg'),
  ('CIN', 'Cincinnati Bengals', '/logos/CIN.svg'),
  ('CLE', 'Cleveland Browns', '/logos/CLE.svg'),
  ('DAL', 'Dallas Cowboys', '/logos/DAL.svg'),
  ('DEN', 'Denver Broncos', '/logos/DEN.svg'),
  ('DET', 'Detroit Lions', '/logos/DET.svg'),
  ('GB', 'Green Bay Packers', '/logos/GB.svg'),
  ('HOU', 'Houston Texans', '/logos/HOU.svg'),
  ('IND', 'Indianapolis Colts', '/logos/IND.svg'),
  ('JAX', 'Jacksonville Jaguars', '/logos/JAX.svg'),
  ('KC', 'Kansas City Chiefs', '/logos/KC.svg'),
  ('LV', 'Las Vegas Raiders', '/logos/LV.svg'),
  ('LAC', 'Los Angeles Chargers', '/logos/LAC.svg'),
  ('LAR', 'Los Angeles Rams', '/logos/LAR.svg'),
  ('MIA', 'Miami Dolphins', '/logos/MIA.svg'),
  ('MIN', 'Minnesota Vikings', '/logos/MIN.svg'),
  ('NE', 'New England Patriots', '/logos/NE.svg'),
  ('NO', 'New Orleans Saints', '/logos/NO.svg'),
  ('NYG', 'New York Giants', '/logos/NYG.svg'),
  ('NYJ', 'New York Jets', '/logos/NYJ.svg'),
  ('PHI', 'Philadelphia Eagles', '/logos/PHI.svg'),
  ('PIT', 'Pittsburgh Steelers', '/logos/PIT.svg'),
  ('SF', 'San Francisco 49ers', '/logos/SF.svg'),
  ('SEA', 'Seattle Seahawks', '/logos/SEA.svg'),
  ('TB', 'Tampa Bay Buccaneers', '/logos/TB.svg'),
  ('TEN', 'Tennessee Titans', '/logos/TEN.svg'),
  ('WAS', 'Washington Commanders', '/logos/WAS.svg');
```

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Optional: Configure email templates under **Email Templates**

## Step 7: Start Your Application

Now you can start the app:

```bash
cd somerepo
npm run dev
```

Visit http://localhost:3000

## Step 8: Create Your First User

1. Navigate to http://localhost:3000/signup
2. Create an account with your email
3. Check your email for verification (if email is configured in Supabase)
4. Or disable email confirmation in Supabase: **Authentication** → **Settings** → **Email Auth** → Uncheck "Enable email confirmations"

## Step 9: Add Sample Games (Optional)

Run this SQL to add some test games:

```sql
INSERT INTO public.games (week, season, home_team_id, away_team_id, game_time, status) VALUES
  (1, 2025, 'KC', 'DET', '2025-09-07 20:20:00+00', 'upcoming'),
  (1, 2025, 'ATL', 'CAR', '2025-09-10 13:00:00+00', 'upcoming'),
  (1, 2025, 'CLE', 'CIN', '2025-09-10 13:00:00+00', 'upcoming'),
  (1, 2025, 'GB', 'CHI', '2025-09-10 13:00:00+00', 'upcoming'),
  (1, 2025, 'DAL', 'NYG', '2025-09-10 16:25:00+00', 'upcoming');
```

## Troubleshooting

### Can't connect to Supabase
- Check `.env.local` has correct URL and key
- Restart dev server after changing `.env.local`
- Check browser console for errors

### Authentication not working
- Verify email confirmations are disabled (for development)
- Check Supabase auth logs: **Authentication** → **Logs**

### Database errors
- Check SQL Editor for error messages
- Verify all tables were created successfully
- Check **Table Editor** to see your tables

## Next Steps

1. **Production deployment**: 
   - Use environment variables in your hosting platform (Vercel, Netlify, etc.)
   - Never commit `.env.local` to git

2. **Game data integration**:
   - Consider using an NFL API to auto-populate games
   - Popular options: ESPN API, The Odds API, or SportsData.io

3. **Admin panel**:
   - Create admin users in Supabase
   - Add admin-only pages to update game scores

## Quick Start Commands

```bash
# Navigate to project
cd "C:\Users\d86pe\OneDrive\Desktop\Learning Stuffs\WizixPool\somerepo"

# Install dependencies (if not done)
npm install --legacy-peer-deps

# Start development server
npm run dev
```

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Your app: http://localhost:3000
