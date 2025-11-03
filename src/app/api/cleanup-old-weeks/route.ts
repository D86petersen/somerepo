import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * API route to delete old weeks' games and picks
 * Only deletes games from weeks that have ended
 * 
 * Usage:
 * POST /api/cleanup-old-weeks
 * Body: { weeksToKeep: 2 } (optional - defaults to keeping 2 most recent weeks)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters
    const body = await request.json().catch(() => ({}));
    const { weeksToKeep = 2, season = 2024 } = body;

    // Use service role client to bypass RLS
    const adminClient = createServiceRoleClient() as any;

    // Get all weeks for the season
    const { data: allGames } = await adminClient
      .from('games')
      .select('week')
      .eq('season', season)
      .order('week', { ascending: false });

    if (!allGames || allGames.length === 0) {
      return NextResponse.json({
        message: 'No games found for cleanup',
        deletedGames: 0,
        deletedPicks: 0,
      });
    }

    // Get unique weeks, sorted descending
    const weeks = [...new Set(allGames.map((g: any) => g.week))].sort((a: any, b: any) => b - a);
    
    // Determine which weeks to delete (keep the most recent N weeks)
    const weeksToDelete = weeks.slice(weeksToKeep);

    if (weeksToDelete.length === 0) {
      return NextResponse.json({
        message: 'No old weeks to delete',
        deletedGames: 0,
        deletedPicks: 0,
        keptWeeks: weeks,
      });
    }

    console.log(`Deleting data for weeks: ${weeksToDelete.join(', ')}`);

    // First, delete picks for those weeks
    const { data: picksToDelete } = await adminClient
      .from('picks')
      .select('id, game:games!inner(week, season)')
      .in('game.week', weeksToDelete)
      .eq('game.season', season);

    let deletedPicksCount = 0;
    if (picksToDelete && picksToDelete.length > 0) {
      const pickIds = picksToDelete.map((p: any) => p.id);
      const { error: picksError } = await adminClient
        .from('picks')
        .delete()
        .in('id', pickIds);

      if (!picksError) {
        deletedPicksCount = pickIds.length;
      }
    }

    // Then delete games for those weeks
    const { data: deletedGames, error: gamesError } = await adminClient
      .from('games')
      .delete()
      .in('week', weeksToDelete)
      .eq('season', season)
      .select();

    if (gamesError) {
      console.error('Error deleting games:', gamesError);
      return NextResponse.json({
        error: 'Failed to delete games',
        details: gamesError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${weeksToDelete.length} old week(s)`,
      deletedGames: deletedGames?.length || 0,
      deletedPicks: deletedPicksCount,
      deletedWeeks: weeksToDelete,
      keptWeeks: weeks.slice(0, weeksToKeep),
      season,
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to cleanup old weeks' 
    }, { status: 500 });
  }
}

/**
 * GET endpoint to see which weeks would be deleted
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weeksToKeep = parseInt(searchParams.get('weeksToKeep') || '2');
    const season = parseInt(searchParams.get('season') || '2024');

    const { data: allGames } = await supabase
      .from('games')
      .select('week')
      .eq('season', season)
      .order('week', { ascending: false });

    if (!allGames || allGames.length === 0) {
      return NextResponse.json({
        message: 'No games found',
        weeks: [],
      });
    }

    const weeks = [...new Set(allGames.map(g => g.week))].sort((a, b) => b - a);
    const weeksToDelete = weeks.slice(weeksToKeep);
    const weeksToKeep_list = weeks.slice(0, weeksToKeep);

    return NextResponse.json({
      allWeeks: weeks,
      weeksToKeep: weeksToKeep_list,
      weeksToDelete,
      weeksToKeepCount: weeksToKeep,
      season,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get cleanup info' 
    }, { status: 500 });
  }
}
