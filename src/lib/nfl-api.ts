// ESPN NFL API integration
// Uses ESPN's free, public API endpoints

export interface ESPNGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
  };
  week: {
    number: number;
  };
  competitions: Array<{
    id: string;
    date: string;
    attendance: number;
    status: {
      type: {
        id: string;
        name: string;
        state: string;
        completed: boolean;
        description: string;
        detail: string;
        shortDetail: string;
      };
      period: number;
      displayClock: string;
    };
    competitors: Array<{
      id: string;
      uid: string;
      type: string;
      order: number;
      homeAway: 'home' | 'away';
      winner: boolean;
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
        shortDisplayName: string;
        name: string;
        logo: string;
      };
      score: string;
    }>;
  }>;
}

export interface ESPNScoreboard {
  leagues: Array<{
    id: string;
    name: string;
    season: {
      year: number;
      type: number;
    };
  }>;
  events: ESPNGame[];
}

/**
 * Fetch NFL scoreboard for a specific week
 * @param year - Season year (e.g., 2025)
 * @param week - Week number (1-18 for regular season)
 */
export async function fetchNFLScoreboard(
  year: number,
  week: number
): Promise<ESPNScoreboard> {
  const seasonType = 2; // 1 = preseason, 2 = regular season, 3 = postseason
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=${seasonType}&week=${week}`;

  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get current NFL week
 */
export async function getCurrentNFLWeek(): Promise<{ year: number; week: number }> {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  
  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    // Fallback to current date calculation
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.max(1, Math.min(18, Math.floor((now.getMonth() * 4 + now.getDate() / 7) - 35)));
    return { year, week };
  }

  const data: ESPNScoreboard = await response.json();
  
  return {
    year: data.leagues[0]?.season.year || new Date().getFullYear(),
    week: data.events[0]?.week?.number || 1,
  };
}

/**
 * Map ESPN team abbreviation to our team IDs
 */
export function mapESPNTeamToTeamId(espnAbbr: string): string {
  const mapping: Record<string, string> = {
    'ARI': 'ARI', 'ATL': 'ATL', 'BAL': 'BAL', 'BUF': 'BUF',
    'CAR': 'CAR', 'CHI': 'CHI', 'CIN': 'CIN', 'CLE': 'CLE',
    'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GB': 'GB',
    'HOU': 'HOU', 'IND': 'IND', 'JAX': 'JAX', 'JAC': 'JAX',
    'KC': 'KC', 'LV': 'LV', 'LAC': 'LAC', 'LAR': 'LAR',
    'MIA': 'MIA', 'MIN': 'MIN', 'NE': 'NE', 'NO': 'NO',
    'NYG': 'NYG', 'NYJ': 'NYJ', 'PHI': 'PHI', 'PIT': 'PIT',
    'SF': 'SF', 'SEA': 'SEA', 'TB': 'TB', 'TEN': 'TEN',
    'WSH': 'WAS', 'WAS': 'WAS',
  };
  
  return mapping[espnAbbr] || espnAbbr;
}

/**
 * Convert ESPN game status to our status format
 */
export function mapESPNGameStatus(espnStatus: ESPNGame['competitions'][0]['status']): {
  status: 'upcoming' | 'live' | 'final';
  quarter: string | null;
  timeRemaining: string | null;
} {
  const state = espnStatus.type.state;
  
  if (state === 'pre') {
    return { status: 'upcoming', quarter: null, timeRemaining: null };
  }
  
  if (state === 'post') {
    return { status: 'final', quarter: null, timeRemaining: null };
  }
  
  // Game is in progress
  const period = espnStatus.period;
  const quarter = period <= 4 ? `Q${period}` : period === 5 ? 'OT' : `OT${period - 4}`;
  
  return {
    status: 'live',
    quarter,
    timeRemaining: espnStatus.displayClock || '0:00',
  };
}

/**
 * Transform ESPN game data to our game format
 */
export function transformESPNGame(espnGame: ESPNGame) {
  const competition = espnGame.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  if (!homeTeam || !awayTeam) {
    throw new Error('Invalid game data: missing home or away team');
  }

  const gameStatus = mapESPNGameStatus(competition.status);

  return {
    id: espnGame.id,
    week: espnGame.week.number,
    season: espnGame.season.year,
    home_team_id: mapESPNTeamToTeamId(homeTeam.team.abbreviation),
    away_team_id: mapESPNTeamToTeamId(awayTeam.team.abbreviation),
    game_time: competition.date,
    status: gameStatus.status,
    home_score: parseInt(homeTeam.score) || 0,
    away_score: parseInt(awayTeam.score) || 0,
    quarter: gameStatus.quarter,
    time_remaining: gameStatus.timeRemaining,
  };
}
