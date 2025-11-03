import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { fetchNFLScoreboard, transformESPNGame, getCurrentNFLWeek } from '@/lib/nfl-api';

/**
 * API route to sync NFL games from ESPN to Supabase
 * Call this endpoint periodically to keep game data fresh
 * 
 * Usage:
 * POST /api/sync-games
 * Body: { week: 1, year: 2025 } (optional - defaults to current week)
 */
export async function POST(request: NextRequest) {
  try {
    // First verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS for game syncing
    const adminClient = createServiceRoleClient() as any;

    // Get week and year from request body or use current
    const body = await request.json().catch(() => ({}));
    let { week, year } = body;

    if (!week || !year) {
      const current = await getCurrentNFLWeek();
      week = week || current.week;
      year = year || current.year;
    }

    // Fetch games from ESPN
    const scoreboard = await fetchNFLScoreboard(year, week);
    
    if (!scoreboard.events || scoreboard.events.length === 0) {
      return NextResponse.json({ 
        message: 'No games found for this week',
        games: 0,
        week,
        year 
      });
    }

    // Transform and upsert games
    const games = scoreboard.events.map(transformESPNGame);
    
    // Insert/update games one by one to handle duplicates properly
    let successCount = 0;
    let errorMessages: string[] = [];

    for (const game of games) {
      try {
        // Check if game already exists
        const { data: existing, error: selectError } = await adminClient
          .from('games')
          .select('id')
          .eq('week', game.week)
          .eq('season', game.season)
          .eq('home_team_id', game.home_team_id)
          .eq('away_team_id', game.away_team_id)
          .maybeSingle();

        if (selectError) {
          errorMessages.push(`Select error for ${game.away_team_id} @ ${game.home_team_id}: ${selectError.message}`);
          continue;
        }

        if (existing) {
          // Update existing game
          const { error: updateError } = await adminClient
            .from('games')
            .update({
              game_time: game.game_time,
              status: game.status,
              home_score: game.home_score,
              away_score: game.away_score,
              quarter: game.quarter,
              time_remaining: game.time_remaining,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!updateError) {
            successCount++;
            console.log(`✅ Updated: ${game.away_team_id} @ ${game.home_team_id}`);
          } else {
            errorMessages.push(`Update failed for ${game.away_team_id} @ ${game.home_team_id}: ${updateError.message}`);
          }
        } else {
          // Insert new game
          const { error: insertError } = await adminClient
            .from('games')
            .insert({
              week: game.week,
              season: game.season,
              home_team_id: game.home_team_id,
              away_team_id: game.away_team_id,
              game_time: game.game_time,
              status: game.status,
              home_score: game.home_score,
              away_score: game.away_score,
              quarter: game.quarter,
              time_remaining: game.time_remaining,
            });

          if (!insertError) {
            successCount++;
            console.log(`✅ Inserted: ${game.away_team_id} @ ${game.home_team_id}`);
          } else {
            console.error(`❌ Insert error:`, insertError);
            errorMessages.push(`Insert failed for ${game.away_team_id} @ ${game.home_team_id}: ${insertError.message}`);
          }
        }
      } catch (err: any) {
        console.error('Error processing game:', err);
        errorMessages.push(`Error processing ${game.away_team_id} @ ${game.home_team_id}: ${err.message}`);
      }
    }

    if (errorMessages.length > 0) {
      console.error('Some games failed to sync:', errorMessages);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} of ${games.length} games for Week ${week}, ${year}`,
      games: successCount,
      errors: errorMessages.length > 0 ? errorMessages : undefined,
      week,
      year,
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to sync games' 
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check sync status and get current week info
 */
export async function GET() {
  try {
    const current = await getCurrentNFLWeek();
    
    return NextResponse.json({
      currentWeek: current.week,
      currentYear: current.year,
      message: 'Use POST to sync games',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get current week' 
    }, { status: 500 });
  }
}
