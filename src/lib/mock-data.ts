import type { Team, Game, UserStanding } from '@/types';

export const teams: Team[] = [
    { id: 'ARI', name: 'Arizona Cardinals', logoUrl: '/logos/ARI.svg' },
    { id: 'ATL', name: 'Atlanta Falcons', logoUrl: '/logos/ATL.svg' },
    { id: 'BAL', name: 'Baltimore Ravens', logoUrl: '/logos/BAL.svg' },
    { id: 'BUF', name: 'Buffalo Bills', logoUrl: '/logos/BUF.svg' },
    { id: 'CAR', name: 'Carolina Panthers', logoUrl: '/logos/CAR.svg' },
    { id: 'CHI', name: 'Chicago Bears', logoUrl: '/logos/CHI.svg' },
    { id: 'CIN', name: 'Cincinnati Bengals', logoUrl: '/logos/CIN.svg' },
    { id: 'CLE', name: 'Cleveland Browns', logoUrl: '/logos/CLE.svg' },
    { id: 'DAL', name: 'Dallas Cowboys', logoUrl: '/logos/DAL.svg' },
    { id: 'DEN', name: 'Denver Broncos', logoUrl: '/logos/DEN.svg' },
    { id: 'DET', name: 'Detroit Lions', logoUrl: '/logos/DET.svg' },
    { id: 'GB', name: 'Green Bay Packers', logoUrl: '/logos/GB.svg' },
    { id: 'HOU', name: 'Houston Texans', logoUrl: '/logos/HOU.svg' },
    { id: 'IND', name: 'Indianapolis Colts', logoUrl: '/logos/IND.svg' },
    { id: 'JAX', name: 'Jacksonville Jaguars', logoUrl: '/logos/JAX.svg' },
    { id: 'KC', name: 'Kansas City Chiefs', logoUrl: '/logos/KC.svg' },
    { id: 'LV', name: 'Las Vegas Raiders', logoUrl: '/logos/LV.svg' },
    { id: 'LAC', name: 'Los Angeles Chargers', logoUrl: '/logos/LAC.svg' },
    { id: 'LAR', name: 'Los Angeles Rams', logoUrl: '/logos/LAR.svg' },
    { id: 'MIA', name: 'Miami Dolphins', logoUrl: '/logos/MIA.svg' },
    { id: 'MIN', name: 'Minnesota Vikings', logoUrl: '/logos/MIN.svg' },
    { id: 'NE', name: 'New England Patriots', logoUrl: '/logos/NE.svg' },
    { id: 'NO', name: 'New Orleans Saints', logoUrl: '/logos/NO.svg' },
    { id: 'NYG', name: 'New York Giants', logoUrl: '/logos/NYG.svg' },
    { id: 'NYJ', name: 'New York Jets', logoUrl: '/logos/NYJ.svg' },
    { id: 'PHI', name: 'Philadelphia Eagles', logoUrl: '/logos/PHI.svg' },
    { id: 'PIT', name: 'Pittsburgh Steelers', logoUrl: '/logos/PIT.svg' },
    { id: 'SF', name: 'San Francisco 49ers', logoUrl: '/logos/SF.svg' },
    { id: 'SEA', name: 'Seattle Seahawks', logoUrl: '/logos/SEA.svg' },
    { id: 'TB', name: 'Tampa Bay Buccaneers', logoUrl: '/logos/TB.svg' },
    { id: 'TEN', name: 'Tennessee Titans', logoUrl: '/logos/TEN.svg' },
    { id: 'WAS', name: 'Washington Commanders', logoUrl: '/logos/WAS.svg' },
];

export const games: Game[] = [
  {
    id: '1',
    week: 1,
    homeTeam: teams.find(t => t.id === 'KC')!,
    awayTeam: teams.find(t => t.id === 'DET')!,
    gameTime: '2025-09-07T20:20:00Z',
    status: 'final',
    homeScore: 21,
    awayScore: 20,
  },
  {
    id: '2',
    week: 1,
    homeTeam: teams.find(t => t.id === 'ATL')!,
    awayTeam: teams.find(t => t.id === 'CAR')!,
    gameTime: '2025-09-10T13:00:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: '3',
    week: 1,
    homeTeam: teams.find(t => t.id === 'CLE')!,
    awayTeam: teams.find(t => t.id === 'CIN')!,
    gameTime: '2025-09-10T13:00:00Z',
    status: 'live',
    homeScore: 14,
    awayScore: 7,
    quarter: 'Q2',
    timeRemaining: '8:32'
  },
  // Add more games as needed
];

export const standings: UserStanding[] = [
    { rank: 1, name: 'Alice', score: 12 },
    { rank: 2, name: 'Bob', score: 11 },
    { rank: 3, name: 'Charlie', score: 10 },
    { rank: 4, name: 'David', score: 9 },
    { rank: 5, name: 'Eve', score: 8 },
];

export const currentUser = {
    name: 'Daniel Thompson',
    email: 'daniel.thompson@example.com',
    avatarUrl: '/avatars/daniel.svg',
};
