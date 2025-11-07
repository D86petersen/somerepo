# 🔄 Auto-Sync Feature - Real-Time Score Updates

## Overview

The app now automatically syncs NFL game scores from ESPN **every 30 seconds** when games are live or upcoming. This keeps your pool's scores fresh without requiring manual refreshes.

## How It Works

### 🎯 Automatic Behavior

- **Triggers**: Auto-sync activates when any game has status `live` or `upcoming`
- **Frequency**: Updates every 30 seconds
- **Pages**: Active on **Picks** and **Schedule** pages
- **Smart**: Stops syncing when all games are `final` to save resources

### 📊 What Gets Synced

Every 30 seconds, the app:
1. Calls ESPN API for the current week's games
2. Updates game scores in the database
3. Refreshes the UI with latest data
4. Logs sync activity to console

### 🎨 Visual Indicators

**Blue Banner at Top:**
```
🟢 Auto-syncing scores every 30 seconds | Last updated: 2:45:30 PM
```

**Live Game Badge:**
```
Week 10 Picks 🔴 Live
```

## Technical Details

### Code Location

**Picks Page:** `src/app/(app)/picks/page.tsx`
- Lines 108-163: Auto-sync useEffect hook
- Lines 272-284: Visual indicator UI

**Schedule Page:** `src/app/(app)/schedule/page.tsx`
- Lines 51-103: Auto-sync useEffect hook
- Lines 118-130: Visual indicator UI

### How the Timer Works

```javascript
useEffect(() => {
  let intervalId: NodeJS.Timeout;

  async function syncWithESPN() {
    // Call /api/sync-games endpoint
    // Reload games from database
    // Update UI and timestamp
  }

  // Only sync if there are live/upcoming games
  const hasLiveGames = games.some(g => 
    g.status === 'live' || g.status === 'upcoming'
  );

  if (hasLiveGames && currentWeek > 0) {
    syncWithESPN(); // Initial sync
    intervalId = setInterval(syncWithESPN, 30000); // Every 30s
  }

  return () => {
    if (intervalId) clearInterval(intervalId); // Cleanup
  };
}, [currentWeek, games]);
```

### Performance Optimizations

✅ **Smart Activation**: Only runs when games are live or upcoming
✅ **Cleanup**: Interval cleared when component unmounts or week changes
✅ **Conditional**: No sync on "final" games (saves API calls)
✅ **Console Logging**: Track sync activity in browser DevTools

## User Experience

### During Live Games

1. User opens Picks or Schedule page
2. Auto-sync starts immediately
3. Blue banner appears showing "Auto-syncing..."
4. Scores update every 30 seconds
5. Last update time displayed
6. Live badge shows on games in progress

### After Games End

1. All games show `final` status
2. Auto-sync stops automatically
3. Blue banner disappears
4. No more API calls (efficient!)

## Testing

### Console Monitoring

Open browser DevTools (F12) → Console tab:
```
✅ Auto-synced Week 10 at 2:45:30 PM
✅ Auto-synced Week 10 at 2:46:00 PM
✅ Auto-synced Week 10 at 2:46:30 PM
```

### Visual Check

**Look for:**
- Blue auto-sync banner (when games are live/upcoming)
- Timestamp updating every 30 seconds
- Scores changing as games progress
- Live badge on in-progress games

## Benefits

🎯 **Real-Time Updates**: Scores refresh automatically without manual action
⚡ **Instant Feedback**: See score changes within 30 seconds
🏈 **Game Day Experience**: Perfect for watching games and tracking picks
💾 **Automatic**: Set it and forget it - no refresh button needed
🔋 **Efficient**: Only syncs when necessary (live/upcoming games)

## API Usage

### Endpoint Called

**POST** `/api/sync-games`

**Payload:**
```json
{
  "week": 10,
  "year": 2025
}
```

**Frequency:**
- Every 30 seconds during live games
- Stops when all games are final

### Rate Considerations

- ESPN API is free and public
- 30-second interval is respectful (120 calls/hour max)
- Auto-stops when not needed
- Recommended for production use

## Deployment

- ✅ **Pushed to GitHub**: `main` branch
- ✅ **Netlify Auto-Deploy**: Triggered automatically
- 🌐 **Live URL**: https://wizix-degenerates.netlify.app
- ⏱️ **Deploy Time**: 2-3 minutes

## Future Enhancements (Optional)

- 🎛️ Configurable interval (15s, 30s, 60s)
- 🔔 Push notifications when scores change
- 📱 Background sync even when tab is inactive
- 🎨 Animated score changes (highlight updates)
- 📊 Show sync health status
- ⏸️ Pause/Resume button for user control

## Notes

- Works on both **Picks** and **Schedule** pages
- Requires active games (live or upcoming)
- Uses existing `/api/sync-games` endpoint
- No additional database setup required
- Works immediately after deployment
