# NFL Pool App - Real Data Integration Guide

## ✅ What's Been Implemented

Your NFL Pool app now features:

1. **Real NFL Game Data** via ESPN's public API
2. **Real-time Updates** using Supabase subscriptions
3. **Live Score Updates** that automatically refresh
4. **Pick Tracking** with database persistence
5. **Standings** that update automatically

## 🚀 Getting Started

### 1. Start the Development Server

```bash
cd somerepo
npm run dev
```

### 2. Sync NFL Games

After setting up Supabase (see SUPABASE_SETUP.md), you need to load NFL game data:

#### Option A: Manual Sync via API

1. **Log in to your app** at http://localhost:3000
2. **Make a POST request** to sync games:

```bash
curl -X POST http://localhost:3000/api/sync-games \
  -H "Content-Type: application/json" \
  -d '{"week": 1, "year": 2025}'
```

Or use the browser console:
```javascript
fetch('/api/sync-games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ week: 1, year: 2025 })
}).then(r => r.json()).then(console.log);
```

#### Option B: Create a Sync Button (Recommended)

Add this to your settings page or create an admin page:

```tsx
async function syncGames() {
  const response = await fetch('/api/sync-games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week: 1, year: 2025 }),
  });
  const data = await response.json();
  console.log(data);
  alert(`Synced ${data.games} games!`);
}
```

### 3. Set Up Automated Sync (Production)

For production, you'll want to sync games automatically. Here are options:

#### Option A: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/sync-games",
    "schedule": "*/5 * * * *"
  }]
}
```

This runs every 5 minutes during game days.

#### Option B: GitHub Actions

Create `.github/workflows/sync-games.yml`:

```yaml
name: Sync NFL Games
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Games
        run: |
          curl -X POST https://your-app.vercel.app/api/sync-games \
            -H "Content-Type: application/json" \
            -d '{"week": 1, "year": 2025}'
```

#### Option C: Supabase Edge Functions

Create a Supabase Edge Function that runs on a schedule using `pg_cron`.

## 📊 How It Works

### Data Flow

```
ESPN API → sync-games API → Supabase Database → Real-time Updates → Your App
```

1. **ESPN API** provides live NFL game data
2. **Sync API** transforms and stores it in Supabase
3. **Supabase Real-time** broadcasts changes
4. **Your App** automatically updates without refresh

### Real-time Features

All pages now have real-time subscriptions:

- **Picks Page**: Updates when games change or become locked
- **Schedule Page**: Live score updates during games
- **Standings Page**: Updates when anyone submits picks or games finish

### Game Status Flow

```
upcoming → live → final
```

- **upcoming**: Before kickoff, users can pick
- **live**: Game in progress, picks locked, scores updating
- **final**: Game over, scores final, used for standings

## 🎮 User Flow

### Making Picks

1. Go to **Picks** page
2. Select a team for each game
3. Enter tie-breaker total
4. Click **Submit Picks**
5. Picks are saved to Supabase

**Note**: Picks are automatically locked when game time arrives.

### Viewing Schedule

1. Go to **Schedule** page
2. See all games for the current week
3. Live games show real-time scores
4. Status updates automatically

### Checking Standings

1. Go to **Standings** page
2. See your rank vs other players
3. Scores update as games finish
4. Real-time updates when anyone submits picks

## 🔧 Configuration

### Current Week Detection

The app automatically detects the current NFL week. To override:

```typescript
// In any component
const [currentWeek, setCurrentWeek] = useState(1);  // Force week 1
```

### Sync Frequency

For live games, sync every **1-5 minutes**. For non-game days, sync **once per day**.

## 📱 Features by Page

### Picks Page (`/picks`)
- ✅ Load games from Supabase
- ✅ Load user's existing picks
- ✅ Real-time game updates
- ✅ Auto-lock when game starts
- ✅ Save picks to database
- ✅ Tie-breaker support

### Schedule Page (`/schedule`)
- ✅ Load games from Supabase
- ✅ Real-time score updates
- ✅ Live game indicators
- ✅ Game status (upcoming/live/final)

### Standings Page (`/standings`)
- ✅ Load from Supabase view
- ✅ Real-time updates
- ✅ Automatic rank calculation
- ✅ Overall/Weekly tabs

## 🧪 Testing

### Test the Integration

1. **Sync a past week** with completed games:
   ```javascript
   fetch('/api/sync-games', {
     method: 'POST',
     body: JSON.stringify({ week: 9, year: 2024 }),
     headers: { 'Content-Type': 'application/json' }
   }).then(r => r.json()).then(console.log);
   ```

2. **Make some picks** on the Picks page

3. **Check the database** in Supabase:
   - Table Editor → games (should have NFL games)
   - Table Editor → picks (should have your picks)
   - Views → standings (should show scores)

4. **Test real-time**:
   - Open two browser windows
   - Make a pick in one
   - Watch standings update in the other

### Manual Game Updates

For testing, update a game score directly in Supabase:

```sql
UPDATE games 
SET home_score = 21, away_score = 17, status = 'final'
WHERE id = 'some-game-id';
```

Watch the schedule page update automatically!

## 🔐 Security Notes

### API Endpoint Protection

The `/api/sync-games` endpoint requires authentication. For production:

1. Add admin role check
2. Use API keys for automated syncs
3. Rate limit the endpoint

Example:
```typescript
// In sync-games/route.ts
const isAdmin = user.email === 'admin@yourapp.com';
if (!isAdmin) {
  return NextResponse.json({ error: 'Admin only' }, { status: 403 });
}
```

## 🐛 Troubleshooting

### Games Not Showing Up

1. Check if teams are in database:
   ```sql
   SELECT * FROM teams;
   ```

2. Run the team seed SQL from SUPABASE_SETUP.md

3. Try syncing again

### Real-time Not Working

1. Check Supabase dashboard → Database → Replication
2. Ensure tables have "Enable Realtime" toggled ON
3. Check browser console for subscription errors

### Picks Not Saving

1. Check Row Level Security policies in Supabase
2. Ensure user is authenticated
3. Check browser console for errors
4. Verify game IDs match between picks and games tables

## 📈 Next Steps

### Enhancements to Add

1. **Week Selector**: Add dropdown to switch weeks
2. **Admin Dashboard**: Manage games, users, override scores
3. **Push Notifications**: Notify users when games go live
4. **Mobile App**: Use React Native with same backend
5. **Playoff Bracket**: Add playoff prediction features
6. **Props/Bonuses**: Additional point opportunities

### Performance Optimizations

1. Add caching with React Query or SWR
2. Implement pagination for large standings
3. Add service worker for offline support
4. Optimize images with next/image

## 🎯 Quick Reference

### Important Files

- `src/lib/nfl-api.ts` - ESPN API integration
- `src/lib/supabase/queries.ts` - Database operations
- `src/app/api/sync-games/route.ts` - Sync endpoint
- `src/types/database.ts` - TypeScript types
- `SUPABASE_SETUP.md` - Database schema

### Key Commands

```bash
# Start dev server
npm run dev

# Sync current week (in browser console)
fetch('/api/sync-games', { method: 'POST' }).then(r => r.json()).then(console.log)

# Check current week (in browser console)
fetch('/api/sync-games').then(r => r.json()).then(console.log)
```

## 🎉 You're Ready!

Your NFL Pool app is now fully integrated with:
- ✅ Real NFL data from ESPN
- ✅ Real-time updates via Supabase
- ✅ Complete pick/standings tracking
- ✅ Production-ready architecture

Just sync the games and start playing! 🏈
