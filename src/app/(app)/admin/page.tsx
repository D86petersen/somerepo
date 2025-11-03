"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [weekInput, setWeekInput] = useState('10');
  const [yearInput, setYearInput] = useState('2025');
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string>('');
  const [weeksToKeep, setWeeksToKeep] = useState('2');
  const [availableWeeks, setAvailableWeeks] = useState<any[]>([]);

  const handleSyncGames = async () => {
    setSyncing(true);
    setMessage('Syncing games from ESPN...');

    try {
      const response = await fetch('/api/sync-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: parseInt(weekInput),
          year: parseInt(yearInput),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Success! Synced ${data.games} games for Week ${data.week}, ${data.year}`);
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to sync'}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const checkDatabase = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Check teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*', { count: 'exact' });

      // Check games
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('week, season', { count: 'exact' });

      // Check picks
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('*', { count: 'exact' });

      // Group games by week and season
      const gamesByWeek = games?.reduce((acc: any, game: any) => {
        const key = `Week ${game.week}, ${game.season}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}) || {};

      setDbStats({
        teams: { count: teams?.length || 0, error: teamsError?.message },
        games: { count: games?.length || 0, error: gamesError?.message, byWeek: gamesByWeek },
        picks: { count: picks?.length || 0, error: picksError?.message },
      });
    } catch (error: any) {
      setMessage(`❌ Database error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOldWeeks = async () => {
    setCleanupLoading(true);
    setCleanupMessage('Cleaning up old weeks...');

    try {
      const response = await fetch(`/api/cleanup-old-weeks?weeksToKeep=${weeksToKeep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (response.ok) {
        setCleanupMessage(`✅ Success! Deleted ${data.deletedPicks} picks and ${data.deletedGames} games from ${data.weeksDeleted.length} old week(s)`);
        // Refresh database stats
        checkDatabase();
      } else {
        setCleanupMessage(`❌ Error: ${data.error || 'Failed to cleanup'}`);
      }
    } catch (error: any) {
      setCleanupMessage(`❌ Error: ${error.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  const previewCleanup = async () => {
    setCleanupLoading(true);
    setCleanupMessage('Checking what would be deleted...');

    try {
      const response = await fetch(`/api/cleanup-old-weeks?weeksToKeep=${weeksToKeep}`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (response.ok) {
        setCleanupMessage(`📋 Would delete: ${data.gamesCount} games and ${data.picksCount} picks from weeks: ${data.weeksToDelete.map((w: any) => `W${w.week}`).join(', ')}`);
      } else {
        setCleanupMessage(`❌ Error: ${data.error || 'Failed to preview'}`);
      }
    } catch (error: any) {
      setCleanupMessage(`❌ Error: ${error.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin / Debug Page</h1>

      {/* Sync Games Section */}
      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sync NFL Games from ESPN</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Week</label>
            <input
              type="number"
              value={weekInput}
              onChange={(e) => setWeekInput(e.target.value)}
              className="w-full bg-slate-700 rounded px-3 py-2 text-white"
              min="1"
              max="18"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Year</label>
            <input
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              className="w-full bg-slate-700 rounded px-3 py-2 text-white"
              min="2024"
              max="2026"
            />
          </div>
        </div>

        <button
          onClick={handleSyncGames}
          disabled={syncing}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Games'}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-slate-700 rounded text-sm">
            {message}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400">
          <p>💡 Tip: Use Week 10, 2025 to sync upcoming games</p>
          <p>💡 Games sync with current scores from ESPN</p>
        </div>
      </div>

      {/* Cleanup Old Weeks Section */}
      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        
        {/* Delete All - Start Fresh */}
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>🗑️</span> Delete All Data
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            Delete all games and picks to start completely fresh. Use this to clear 2024 data and start with 2025.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                setCleanupLoading(true);
                setCleanupMessage('Checking data...');
                try {
                  const res = await fetch('/api/delete-all');
                  const data = await res.json();
                  setCleanupMessage(`📋 Would delete: ${data.gamesCount} games and ${data.picksCount} picks`);
                } catch (error: any) {
                  setCleanupMessage(`❌ Error: ${error.message}`);
                } finally {
                  setCleanupLoading(false);
                }
              }}
              disabled={cleanupLoading}
              className="bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {cleanupLoading ? 'Checking...' : 'Preview Delete All'}
            </button>
            <button
              onClick={async () => {
                if (!confirm('Are you sure? This will delete ALL games and picks! This cannot be undone.')) {
                  return;
                }
                setCleanupLoading(true);
                setCleanupMessage('Deleting all data...');
                try {
                  const res = await fetch('/api/delete-all', { method: 'POST' });
                  const data = await res.json();
                  if (res.ok) {
                    setCleanupMessage(`✅ Deleted ${data.deletedGames} games and ${data.deletedPicks} picks. You can now sync fresh data!`);
                    checkDatabase();
                  } else {
                    setCleanupMessage(`❌ Error: ${data.error}`);
                  }
                } catch (error: any) {
                  setCleanupMessage(`❌ Error: ${error.message}`);
                } finally {
                  setCleanupLoading(false);
                }
              }}
              disabled={cleanupLoading}
              className="bg-red-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {cleanupLoading ? 'Deleting...' : '⚠️ DELETE ALL'}
            </button>
          </div>
        </div>

        {/* Delete Specific Weeks */}
        <div className="mb-6 p-4 bg-orange-900/20 border border-orange-500 rounded">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>📅</span> Delete Specific Weeks
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            View and delete specific weeks (e.g., delete old 2024 weeks).
          </p>
          <button
            onClick={async () => {
              setCleanupLoading(true);
              try {
                const res = await fetch('/api/delete-weeks');
                const data = await res.json();
                setAvailableWeeks(data.weeksBySeason || []);
                setCleanupMessage(`Found weeks: ${JSON.stringify(data.weeksBySeason)}`);
              } catch (error: any) {
                setCleanupMessage(`❌ Error: ${error.message}`);
              } finally {
                setCleanupLoading(false);
              }
            }}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50 mb-3"
            disabled={cleanupLoading}
          >
            {cleanupLoading ? 'Loading...' : 'Show Available Weeks'}
          </button>
          
          {availableWeeks.length > 0 && (
            <div className="space-y-2">
              {availableWeeks.map((seasonData: any) => (
                <div key={seasonData.season} className="bg-slate-700 rounded p-3">
                  <p className="font-semibold mb-2">Season {seasonData.season}</p>
                  <div className="flex flex-wrap gap-2">
                    {seasonData.weeks.map((week: number) => (
                      <button
                        key={week}
                        onClick={async () => {
                          if (!confirm(`Delete Week ${week} from ${seasonData.season}?`)) return;
                          setCleanupLoading(true);
                          try {
                            const res = await fetch('/api/delete-weeks', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ weeks: [week], season: seasonData.season }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              setCleanupMessage(`✅ Deleted week ${week}: ${data.deletedGames} games, ${data.deletedPicks} picks`);
                              // Refresh weeks list
                              const refreshRes = await fetch('/api/delete-weeks');
                              const refreshData = await refreshRes.json();
                              setAvailableWeeks(refreshData.weeksBySeason || []);
                              checkDatabase();
                            } else {
                              setCleanupMessage(`❌ Error: ${data.error}`);
                            }
                          } catch (error: any) {
                            setCleanupMessage(`❌ Error: ${error.message}`);
                          } finally {
                            setCleanupLoading(false);
                          }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        disabled={cleanupLoading}
                      >
                        Delete W{week}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auto Cleanup - Keep only current week */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500 rounded">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>🤖</span> Automatic Cleanup
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            Automatically delete all weeks except the current/upcoming week. 
            Deadline is Thursday at 12pm Pacific.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                setCleanupLoading(true);
                setCleanupMessage('Checking auto-cleanup...');
                try {
                  const res = await fetch('/api/auto-cleanup');
                  const data = await res.json();
                  setCleanupMessage(`📋 Would keep Week ${data.currentWeek}, delete ${data.wouldDeleteWeeks.length} week(s): ${data.wouldDeleteWeeks.join(', ') || 'none'}`);
                } catch (error: any) {
                  setCleanupMessage(`❌ Error: ${error.message}`);
                } finally {
                  setCleanupLoading(false);
                }
              }}
              disabled={cleanupLoading}
              className="bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {cleanupLoading ? 'Checking...' : 'Preview Auto-Cleanup'}
            </button>
            <button
              onClick={async () => {
                setCleanupLoading(true);
                setCleanupMessage('Running auto-cleanup...');
                try {
                  const res = await fetch('/api/auto-cleanup', { method: 'POST' });
                  const data = await res.json();
                  if (res.ok) {
                    setCleanupMessage(`✅ Success! Kept Week ${data.currentWeek}, deleted ${data.deletedGames} games and ${data.deletedPicks} picks from weeks: ${data.weeksDeleted.join(', ')}`);
                    checkDatabase();
                  } else {
                    setCleanupMessage(`❌ Error: ${data.error}`);
                  }
                } catch (error: any) {
                  setCleanupMessage(`❌ Error: ${error.message}`);
                } finally {
                  setCleanupLoading(false);
                }
              }}
              disabled={cleanupLoading}
              className="bg-orange-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {cleanupLoading ? 'Cleaning...' : 'Run Auto-Cleanup'}
            </button>
          </div>
        </div>

        {/* Manual Cleanup - Keep N weeks */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Manual Cleanup (Advanced)</h3>
          <label className="block text-sm text-slate-400 mb-2">Weeks to Keep</label>
          <input
            type="number"
            value={weeksToKeep}
            onChange={(e) => setWeeksToKeep(e.target.value)}
            className="w-full bg-slate-700 rounded px-3 py-2 text-white"
            min="1"
            max="10"
          />
          <p className="text-xs text-slate-400 mt-1">
            All weeks older than the most recent {weeksToKeep} will be deleted
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={previewCleanup}
            disabled={cleanupLoading}
            className="bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {cleanupLoading ? 'Checking...' : 'Preview Cleanup'}
          </button>
          <button
            onClick={handleCleanupOldWeeks}
            disabled={cleanupLoading}
            className="bg-red-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {cleanupLoading ? 'Deleting...' : 'Delete Old Weeks'}
          </button>
        </div>

        {cleanupMessage && (
          <div className="p-3 bg-slate-700 rounded text-sm">
            {cleanupMessage}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400">
          <p>⚠️ Warning: This will permanently delete games and picks from old weeks</p>
          <p>💡 Tip: Use Auto-Cleanup to keep only the current week (recommended)</p>
        </div>
      </div>

      {/* Database Stats Section */}
      <div className="bg-slate-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Database Status</h2>
        
        <button
          onClick={checkDatabase}
          disabled={loading}
          className="w-full bg-slate-700 text-white py-3 rounded-lg font-semibold mb-4 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Database'}
        </button>

        {dbStats && (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span>Teams:</span>
              <span className="font-bold">{dbStats.teams.count}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span>Games:</span>
              <span className="font-bold">{dbStats.games.count}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span>Picks:</span>
              <span className="font-bold">{dbStats.picks.count}</span>
            </div>
            
            {dbStats.games.count > 0 && dbStats.games.byWeek && (
              <div className="p-3 bg-slate-700 rounded">
                <p className="font-semibold mb-2">Games by Week:</p>
                <div className="text-sm space-y-1">
                  {Object.entries(dbStats.games.byWeek).map(([key, count]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-300">{key}:</span>
                      <span className="text-green-400 font-mono">{count} games</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(dbStats.teams.error || dbStats.games.error || dbStats.picks.error) && (
              <div className="p-3 bg-red-900/20 border border-red-500 rounded text-sm text-red-300">
                <p className="font-semibold mb-1">Errors:</p>
                {dbStats.teams.error && <p>Teams: {dbStats.teams.error}</p>}
                {dbStats.games.error && <p>Games: {dbStats.games.error}</p>}
                {dbStats.picks.error && <p>Picks: {dbStats.picks.error}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded text-sm">
        <p className="font-semibold mb-2">Setup Steps:</p>
        <ol className="list-decimal list-inside space-y-1 text-slate-300">
          <li>Check database - should show 32 teams</li>
          <li>If 0 teams, run the team seed SQL from SUPABASE_SETUP.md</li>
          <li>Sync games using the form above</li>
          <li>Go to Picks page to make selections</li>
        </ol>
      </div>
    </div>
  );
}
