import { createClient } from './client';
import type { Database } from '@/types/database';
import type { Game, Team, UserPick, UserStanding } from '@/types';

type Tables = Database['public']['Tables'];

/**
 * Fetch all teams from Supabase
 */
export async function fetchTeams(): Promise<Team[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  return data.map(team => ({
    id: team.id,
    name: team.name,
    logoUrl: team.logo_url || `/logos/${team.id}.svg`,
  }));
}

/**
 * Fetch games for a specific week and season
 */
export async function fetchGames(week: number, season?: number): Promise<Game[]> {
  const supabase = createClient();
  
  // Build query
  let query = supabase
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*)
    `)
    .eq('week', week)
    .order('game_time');

  // Only filter by season if provided
  if (season) {
    query = query.eq('season', season);
  }

  const { data: gamesData, error } = await query;

  if (error) {
    console.error('Error fetching games:', error);
    return [];
  }

  if (!gamesData || gamesData.length === 0) {
    console.log(`No games found for week ${week}${season ? ` season ${season}` : ''}`);
    return [];
  }

  return gamesData.map((game: any) => ({
    id: game.id,
    week: game.week,
    homeTeam: {
      id: game.home_team.id,
      name: game.home_team.name,
      logoUrl: game.home_team.logo_url || `/logos/${game.home_team.id}.svg`,
    },
    awayTeam: {
      id: game.away_team.id,
      name: game.away_team.name,
      logoUrl: game.away_team.logo_url || `/logos/${game.away_team.id}.svg`,
    },
    gameTime: game.game_time,
    status: game.status,
    homeScore: game.home_score,
    awayScore: game.away_score,
    quarter: game.quarter,
    timeRemaining: game.time_remaining,
  }));
}

/**
 * Fetch user's picks for a specific week
 */
export async function fetchUserPicks(userId: string, week: number, season?: number): Promise<UserPick[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('picks')
    .select(`
      *,
      game:games(week, season)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching picks:', error);
    return [];
  }

  // Filter by week/season on client side since we joined the games table
  const filtered = data.filter((pick: any) => {
    if (season) {
      return pick.game.week === week && pick.game.season === season;
    }
    return pick.game.week === week;
  });

  return filtered.map((pick: any) => ({
    gameId: pick.game_id,
    selectedTeamId: pick.selected_team_id,
    tieBreaker: pick.tie_breaker,
  }));
}

/**
 * Save or update a user's pick
 */
export async function savePick(
  userId: string,
  gameId: string,
  selectedTeamId: string,
  tieBreaker?: number | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('picks')
    .upsert({
      user_id: userId,
      game_id: gameId,
      selected_team_id: selectedTeamId,
      tie_breaker: tieBreaker,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,game_id'
    });

  if (error) {
    console.error('Error saving pick:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Save multiple picks at once
 */
export async function saveMultiplePicks(
  userId: string,
  picks: Array<{ gameId: string; selectedTeamId: string; tieBreaker?: number | null }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const picksToSave = picks.map(pick => ({
    user_id: userId,
    game_id: pick.gameId,
    selected_team_id: pick.selectedTeamId,
    tie_breaker: pick.tieBreaker,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('picks')
    .upsert(picksToSave, {
      onConflict: 'user_id,game_id'
    });

  if (error) {
    console.error('Error saving picks:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Fetch standings (overall)
 */
export async function fetchStandings(): Promise<UserStanding[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('standings')
    .select('*')
    .order('score', { ascending: false });

  if (error) {
    console.error('Error fetching standings:', error);
    return [];
  }

  return data.map((standing, index) => ({
    rank: index + 1,
    name: standing.full_name || standing.email?.split('@')[0] || 'Unknown',
    score: standing.score || 0,
  }));
}

/**
 * Subscribe to real-time game updates
 */
export function subscribeToGames(
  week: number,
  season: number | undefined,
  callback: (payload: any) => void
) {
  const supabase = createClient();
  
  // Build filter based on whether season is provided
  const filter = season 
    ? `week=eq.${week},season=eq.${season}`
    : `week=eq.${week}`;
  
  const channel = supabase
    .channel('games-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to real-time picks updates
 */
export function subscribeToPicks(
  userId: string,
  callback: (payload: any) => void
) {
  const supabase = createClient();
  
  const channel = supabase
    .channel('picks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'picks',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to real-time standings updates
 */
export function subscribeToStandings(callback: (payload: any) => void) {
  const supabase = createClient();
  
  // Since standings is a view, we'll subscribe to picks table changes
  // which will affect standings
  const channel = supabase
    .channel('standings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'picks',
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
