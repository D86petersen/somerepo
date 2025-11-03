export interface Team {
  id: string;
  name: string;
  logoUrl: string;
}

export interface Game {
  id: string;
  week: number;
  homeTeam: Team;
  awayTeam: Team;
  gameTime: string; // ISO 8601 format
  status: 'upcoming' | 'live' | 'final';
  homeScore: number;
  awayScore: number;
  quarter?: string;
  timeRemaining?: string;
}

export interface UserPick {
  gameId: string;
  selectedTeamId: string | null;
  tieBreaker: number | null;
}

export interface UserStanding {
  rank: number;
  name: string;
  score: number;
}
