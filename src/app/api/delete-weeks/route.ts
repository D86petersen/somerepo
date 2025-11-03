import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Delete specific weeks
 * POST body: { weeks: [9, 10], season: 2024 }
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = createServiceRoleClient() as any;
    const body = await request.json();
    const { weeks, season } = body;

    if (!weeks || !Array.isArray(weeks) || weeks.length === 0) {
      return NextResponse.json({ error: 'Please provide weeks array' }, { status: 400 });
    }

    // Get games for the specified weeks
    let query = adminClient
      .from('games')
      .select('id, week, season')
      .in('week', weeks);

    if (season) {
      query = query.eq('season', season);
    }

    const { data: gamesToDelete, error: selectError } = await query;

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!gamesToDelete || gamesToDelete.length === 0) {
      return NextResponse.json({
        message: 'No games found for the specified weeks',
        deletedGames: 0,
        deletedPicks: 0,
      });
    }

    const gameIds = gamesToDelete.map((g: any) => g.id);

    // Delete picks first
    const { error: picksError, count: deletedPicks } = await adminClient
      .from('picks')
      .delete()
      .in('game_id', gameIds);

    if (picksError) {
      return NextResponse.json({ error: 'Failed to delete picks: ' + picksError.message }, { status: 500 });
    }

    // Delete games
    const { error: gamesError, count: deletedGames } = await adminClient
      .from('games')
      .delete()
      .in('id', gameIds);

    if (gamesError) {
      return NextResponse.json({ error: 'Failed to delete games: ' + gamesError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted weeks ${weeks.join(', ')}`,
      weeks,
      season,
      deletedGames: deletedGames || 0,
      deletedPicks: deletedPicks || 0,
    });
  } catch (error: any) {
    console.error('Delete weeks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminClient = createServiceRoleClient() as any;
    
    // Get all unique weeks
    const { data: games } = await adminClient
      .from('games')
      .select('week, season')
      .order('season', { ascending: false })
      .order('week', { ascending: false });

    if (!games || games.length === 0) {
      return NextResponse.json({ weeks: [] });
    }

    // Group by season
    const weeksBySeason: any = {};
    games.forEach((g: any) => {
      if (!weeksBySeason[g.season]) {
        weeksBySeason[g.season] = new Set();
      }
      weeksBySeason[g.season].add(g.week);
    });

    // Convert to array format
    const result = Object.entries(weeksBySeason).map(([season, weeks]: [string, any]) => ({
      season: parseInt(season),
      weeks: Array.from(weeks).sort((a: any, b: any) => a - b),
    }));

    return NextResponse.json({ weeksBySeason: result });
  } catch (error: any) {
    console.error('Get weeks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
