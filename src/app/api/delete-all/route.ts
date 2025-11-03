import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Delete all games and picks from the database
 * Use this to start fresh
 */
export async function POST() {
  try {
    const adminClient = createServiceRoleClient() as any;

    // Delete all picks first (foreign key constraint)
    const { error: picksError, count: deletedPicks } = await adminClient
      .from('picks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (picksError) {
      console.error('Error deleting picks:', picksError);
      return NextResponse.json({ error: 'Failed to delete picks: ' + picksError.message }, { status: 500 });
    }

    // Delete all games
    const { error: gamesError, count: deletedGames } = await adminClient
      .from('games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (gamesError) {
      console.error('Error deleting games:', gamesError);
      return NextResponse.json({ error: 'Failed to delete games: ' + gamesError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All games and picks deleted successfully',
      deletedGames: deletedGames || 0,
      deletedPicks: deletedPicks || 0,
    });
  } catch (error: any) {
    console.error('Delete all error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const adminClient = createServiceRoleClient() as any;

    const { count: gamesCount } = await adminClient
      .from('games')
      .select('*', { count: 'exact', head: true });

    const { count: picksCount } = await adminClient
      .from('picks')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      gamesCount: gamesCount || 0,
      picksCount: picksCount || 0,
      message: `Would delete ${gamesCount} games and ${picksCount} picks`,
    });
  } catch (error: any) {
    console.error('Count error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
