import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Automatic cleanup API - deletes all weeks except the current and upcoming week
 * This should be called periodically (e.g., weekly via cron job)
 * 
 * Usage:
 * POST /api/auto-cleanup
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = createServiceRoleClient() as any;

    // Get current date in Pacific Time
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    // Get all games
    const { data: allGames } = await adminClient
      .from('games')
      .select('week, season, game_time, id')
      .order('game_time', { ascending: true });

    if (!allGames || allGames.length === 0) {
      return NextResponse.json({
        message: 'No games found',
        deletedGames: 0,
        deletedPicks: 0,
      });
    }

    // Find the current/upcoming week (first game that hasn't started yet or most recent)
    let currentWeek = 1;
    let currentSeason = new Date().getFullYear();
    
    // Find the first game that's in the future or currently playing
    const upcomingGame = allGames.find((g: any) => new Date(g.game_time) > pacificTime);
    
    if (upcomingGame) {
      currentWeek = upcomingGame.week;
      currentSeason = upcomingGame.season;
    } else {
      // All games are in the past, use the most recent
      const mostRecentGame = allGames[allGames.length - 1];
      currentWeek = mostRecentGame.week;
      currentSeason = mostRecentGame.season;
    }

    // Delete all weeks EXCEPT the current week
    // This keeps only the active/upcoming week
    const { data: gamesToDelete } = await adminClient
      .from('games')
      .select('id, week')
      .eq('season', currentSeason)
      .neq('week', currentWeek);

    if (!gamesToDelete || gamesToDelete.length === 0) {
      return NextResponse.json({
        message: 'No old weeks to delete',
        currentWeek,
        deletedGames: 0,
        deletedPicks: 0,
      });
    }

    const gameIdsToDelete = gamesToDelete.map((g: any) => g.id);
    const weeksDeleted = [...new Set(gamesToDelete.map((g: any) => g.week))];

    // Delete picks first (foreign key constraint)
    const { error: picksError, count: deletedPicksCount } = await adminClient
      .from('picks')
      .delete()
      .in('game_id', gameIdsToDelete);

    if (picksError) {
      console.error('Error deleting picks:', picksError);
      return NextResponse.json({ error: 'Failed to delete picks' }, { status: 500 });
    }

    // Delete games
    const { error: gamesError, count: deletedGamesCount } = await adminClient
      .from('games')
      .delete()
      .in('id', gameIdsToDelete);

    if (gamesError) {
      console.error('Error deleting games:', gamesError);
      return NextResponse.json({ error: 'Failed to delete games' }, { status: 500 });
    }

    console.log(`✅ Auto-cleanup: Deleted ${deletedPicksCount} picks and ${deletedGamesCount} games from weeks: ${weeksDeleted.join(', ')}`);
    console.log(`✅ Kept current week: ${currentWeek}`);

    return NextResponse.json({
      success: true,
      message: `Deleted all weeks except current week ${currentWeek}`,
      currentWeek,
      currentSeason,
      weeksDeleted,
      deletedGames: deletedGamesCount || 0,
      deletedPicks: deletedPicksCount || 0,
    });
  } catch (error: any) {
    console.error('Auto-cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET endpoint to preview what would be deleted
 */
export async function GET() {
  try {
    const adminClient = createServiceRoleClient() as any;

    // Get current date in Pacific Time
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    // Get all games
    const { data: allGames } = await adminClient
      .from('games')
      .select('week, season, game_time, id')
      .order('game_time', { ascending: true });

    if (!allGames || allGames.length === 0) {
      return NextResponse.json({
        message: 'No games found',
        currentWeek: null,
        wouldDeleteWeeks: [],
        wouldDeleteGamesCount: 0,
      });
    }

    // Find the current/upcoming week
    const upcomingGame = allGames.find((g: any) => new Date(g.game_time) > pacificTime);
    
    let currentWeek = 1;
    let currentSeason = new Date().getFullYear();
    
    if (upcomingGame) {
      currentWeek = upcomingGame.week;
      currentSeason = upcomingGame.season;
    } else {
      const mostRecentGame = allGames[allGames.length - 1];
      currentWeek = mostRecentGame.week;
      currentSeason = mostRecentGame.season;
    }

    // Count games that would be deleted
    const gamesToDelete = allGames.filter((g: any) => 
      g.season === currentSeason && g.week !== currentWeek
    );

    const weeksToDelete = [...new Set(gamesToDelete.map((g: any) => g.week))];

    return NextResponse.json({
      currentWeek,
      currentSeason,
      pacificTime: pacificTime.toISOString(),
      wouldDeleteWeeks: weeksToDelete,
      wouldDeleteGamesCount: gamesToDelete.length,
      message: `Would keep week ${currentWeek}, delete ${weeksToDelete.length} other weeks`,
    });
  } catch (error: any) {
    console.error('Auto-cleanup preview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
