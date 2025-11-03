# NFL Team Logos Setup Guide

## Current Status
You already have placeholder SVG files for all 32 NFL teams in `/public/logos/`.

## To Use Official NFL Logos

### Option 1: Use ESPN's Logo API (Recommended)
The ESPN API provides official team logos. Your app can dynamically fetch them:

1. The logos are available at: `https://a.espncdn.com/i/teamlogos/nfl/500/[TEAM].png`
   - Example: `https://a.espncdn.com/i/teamlogos/nfl/500/KC.png` (Kansas City Chiefs)

2. To update your database to use ESPN logos, run this SQL in Supabase:

```sql
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nfl/500/' || id || '.png';
```

### Option 2: Download Official Logos Manually
1. Visit each team's official website or use a logo repository like:
   - https://www.sportslogos.net/teams/list_by_league/7/National_Football_League/NFL/logos/
   - ESPN's CDN (as mentioned above)

2. Save each logo as SVG or PNG format
3. Name them according to team abbreviations (ARI.svg, ATL.svg, etc.)
4. Place them in `/public/logos/`

### Option 3: Use the ESPN CDN (Easiest)
The app is already configured to work with local logos, but you can update the sync script to fetch ESPN logos automatically.

## Team Abbreviations
- ARI: Arizona Cardinals
- ATL: Atlanta Falcons
- BAL: Baltimore Ravens
- BUF: Buffalo Bills
- CAR: Carolina Panthers
- CHI: Chicago Bears
- CIN: Cincinnati Bengals
- CLE: Cleveland Browns
- DAL: Dallas Cowboys
- DEN: Denver Broncos
- DET: Detroit Lions
- GB: Green Bay Packers
- HOU: Houston Texans
- IND: Indianapolis Colts
- JAX: Jacksonville Jaguars
- KC: Kansas City Chiefs
- LAC: Los Angeles Chargers
- LAR: Los Angeles Rams
- LV: Las Vegas Raiders
- MIA: Miami Dolphins
- MIN: Minnesota Vikings
- NE: New England Patriots
- NO: New Orleans Saints
- NYG: New York Giants
- NYJ: New York Jets
- PHI: Philadelphia Eagles
- PIT: Pittsburgh Steelers
- SF: San Francisco 49ers
- SEA: Seattle Seahawks
- TB: Tampa Bay Buccaneers
- TEN: Tennessee Titans
- WAS: Washington Commanders

## Legal Note
⚠️ NFL team logos are trademarked. This application is for personal/educational use only. For commercial use, you would need proper licensing from the NFL.

## Quick Setup (Recommended)
Run this SQL to use ESPN's logo CDN (no downloads needed):

```sql
UPDATE teams SET logo_url = CONCAT('https://a.espncdn.com/i/teamlogos/nfl/500/', id, '.png');
```

This will make all logos load from ESPN's servers automatically!
