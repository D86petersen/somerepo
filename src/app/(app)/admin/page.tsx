"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'd86petersen@gmail.com';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [weekInput, setWeekInput] = useState('10');
  const [yearInput, setYearInput] = useState('2025');
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string>('');
  const [rules, setRules] = useState('');
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        loadRules();
      } else {
        setIsAdmin(false);
      }
      
      setAuthLoading(false);
    }

    checkAdmin();
  }, []);

  const loadRules = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('pool_settings')
      .select('rules')
      .single();
    
    if (data?.rules) {
      setRules(data.rules);
    }
  };

  const saveRules = async () => {
    setSavingRules(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('pool_settings')
      .upsert({ id: 1, rules }, { onConflict: 'id' });
    
    if (error) {
      alert('Error saving rules: ' + error.message);
    } else {
      alert('✅ Rules saved successfully!');
    }
    
    setSavingRules(false);
  };

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-400">⛔ Access Denied</h1>
          <p className="text-slate-300 mb-4">You do not have permission to access the admin panel.</p>
          <button
            onClick={() => window.location.href = '/picks'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Return to Picks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin / Debug Page</h1>

      {/* Pool Rules Editor */}
      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>📋</span> Pool Rules Editor
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Edit the pool rules that appear in the Settings page for all users.
        </p>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="w-full bg-slate-700 rounded px-3 py-2 text-white min-h-[200px] font-mono text-sm"
          placeholder="Enter pool rules here..."
        />
        <button
          onClick={saveRules}
          disabled={savingRules}
          className="mt-3 w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {savingRules ? 'Saving...' : '💾 Save Rules'}
        </button>
      </div>

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
