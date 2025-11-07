"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchGames, fetchUserPicks, saveMultiplePicks, subscribeToGames } from '@/lib/supabase/queries';
import { getCurrentNFLWeek } from '@/lib/nfl-api';
import { getWeekDeadline, isPastDeadline as checkPastDeadline, formatDeadline } from '@/lib/deadline';
import PickCard from '@/components/PickCard';
import type { Game, UserPick } from '@/types';

export default function PicksPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [tieBreaker, setTieBreaker] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(10); // Default to week 10 (or whichever week has games)
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState<Date | null>(null);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Get current user
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      setUserId(user.id);

      // Fetch all games to find which weeks have data
      const { data: allGames } = await supabase
        .from('games')
        .select('week')
        .order('week');

      if (allGames && allGames.length > 0) {
        // Get unique weeks
        const weeks = [...new Set(allGames.map(g => g.week))].sort((a, b) => a - b);
        
        // Filter out past weeks (only show current and future weeks)
        const now = new Date();
        const currentWeeks = weeks.filter(week => {
          // Keep all weeks for now during development
          // In production, you'd want to filter by actual game dates
          return true;
        });
        
        setAvailableWeeks(currentWeeks);
        
        // Find the first available week
        const upcomingWeek = currentWeeks.find(week => week >= 1) || currentWeeks[currentWeeks.length - 1];
        
        setCurrentWeek(upcomingWeek);
      }
    }

    init();
  }, []);

  // Load data when week changes
  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      setLoading(true);
      
      // Load games and picks
      const [gamesData, picksData] = await Promise.all([
        fetchGames(currentWeek),
        fetchUserPicks(userId!, currentWeek),
      ]);

      setGames(gamesData);
      setPicks(picksData);
      
      // Calculate deadline: Thursday at 12pm Pacific before the week's games
      if (gamesData.length > 0) {
        const sortedGames = [...gamesData].sort((a, b) => 
          new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime()
        );
        const gameTimeData = sortedGames.map(g => ({ game_time: g.gameTime }));
        const deadline = getWeekDeadline(gameTimeData);
        setDeadlineTime(deadline);
        setIsPastDeadline(checkPastDeadline(deadline));
      }
      
      // Find tie breaker from picks
      const tbPick = picksData.find(p => p.tieBreaker !== null);
      if (tbPick) {
        setTieBreaker(tbPick.tieBreaker);
      }

      setLoading(false);
    }

    loadData();
  }, [currentWeek, userId]);

  // Subscribe to real-time game updates
  useEffect(() => {
    const channel = subscribeToGames(currentWeek, undefined, async () => {
      // Reload games when they change
      const gamesData = await fetchGames(currentWeek);
      setGames(gamesData);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentWeek]);

  // Auto-sync with ESPN every 30 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function syncWithESPN() {
      if (!userId) return;
      
      try {
        setAutoSyncing(true);
        
        // Call the sync API for the current week
        const response = await fetch('/api/sync-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week: currentWeek,
            year: 2025,
          }),
        });

        if (response.ok) {
          // Reload games AND picks after successful sync to keep everything in sync
          const [gamesData, picksData] = await Promise.all([
            fetchGames(currentWeek),
            fetchUserPicks(userId, currentWeek),
          ]);
          
          setGames(gamesData);
          setPicks(picksData);
          
          // Restore tie breaker if it exists
          const tbPick = picksData.find(p => p.tieBreaker !== null);
          if (tbPick) {
            setTieBreaker(tbPick.tieBreaker);
          }
          
          setLastSyncTime(new Date());
          console.log(`✅ Auto-synced Week ${currentWeek} at ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      } finally {
        setAutoSyncing(false);
      }
    }

    // Always auto-sync - continuous real-time updates
    if (currentWeek > 0 && userId) {
      // Initial sync
      syncWithESPN();
      
      // Set up interval for every 30 seconds (continuous)
      intervalId = setInterval(syncWithESPN, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentWeek, userId]);

  const handlePickChange = (gameId: string, selectedTeamId: string) => {
    setPicks(prevPicks => {
      const existingPick = prevPicks.find(p => p.gameId === gameId);
      if (existingPick) {
        return prevPicks.map(p => 
          p.gameId === gameId ? { ...p, selectedTeamId } : p
        );
      }
      return [...prevPicks, { gameId, selectedTeamId, tieBreaker: null }];
    });
  };

  const handleSubmitPicks = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    try {
      const picksToSave = picks.map(pick => ({
        gameId: pick.gameId,
        selectedTeamId: pick.selectedTeamId || '',
        tieBreaker: pick.gameId === games[games.length - 1]?.id ? tieBreaker : null,
      }));

      const result = await saveMultiplePicks(userId, picksToSave);

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Picks saved successfully!' });
        
        // Reload picks to confirm they were saved
        const updatedPicks = await fetchUserPicks(userId, currentWeek);
        setPicks(updatedPicks);
        
        // Find tie breaker from saved picks
        const tbPick = updatedPicks.find(p => p.tieBreaker !== null);
        if (tbPick) {
          setTieBreaker(tbPick.tieBreaker);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save picks' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving picks' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading games for week {currentWeek}...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Week {currentWeek} Picks</h1>
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-4">No games available for week {currentWeek}.</p>
          <p className="text-sm text-slate-500 mb-4">Games will appear once they are scheduled and synced.</p>
          
          {availableWeeks.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-400 mb-3">Available weeks with games:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableWeeks.map(week => (
                  <button
                    key={week}
                    onClick={() => setCurrentWeek(week)}
                    className="px-4 py-2 bg-slate-700 hover:bg-primary rounded-lg transition-colors"
                  >
                    Week {week}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-left bg-slate-700 rounded p-4 mt-6">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>Current Week: {currentWeek}</p>
            <p>User ID: {userId || 'Not set'}</p>
            <p>Games Count: {games.length}</p>
            <p>Available Weeks: {availableWeeks.join(', ') || 'None'}</p>
            <p className="mt-2 text-slate-400">💡 Tip: Go to the Admin page to sync more games, or click an available week above.</p>
          </div>
        </div>
      </div>
    );
  }

  const hasUnlockedGames = games.some(game => new Date(game.gameTime) > new Date());
  const allPicksMade = games.every(game => picks.some(p => p.gameId === game.id && p.selectedTeamId));

  return (
    <div className="p-4 pb-24">
      {/* Auto-sync indicator - always show */}
      <div className="mb-4 bg-blue-900/20 border border-blue-500 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-slate-300">Auto-syncing scores every 30 seconds</span>
        </div>
        {lastSyncTime && (
          <span className="text-xs text-slate-400">
            Last updated: {lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Week Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Week {currentWeek} Picks
          {games.some(g => g.status === 'live') && (
            <span className="flex items-center gap-1 text-xs font-normal text-red-400 bg-red-500/20 px-2 py-1 rounded">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentIndex = availableWeeks.indexOf(currentWeek);
              if (currentIndex > 0) {
                setCurrentWeek(availableWeeks[currentIndex - 1]);
              }
            }}
            disabled={availableWeeks.indexOf(currentWeek) <= 0}
            className="px-3 py-1 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            ←
          </button>
          <span className="text-sm text-slate-400">
            Week {currentWeek} {availableWeeks.length > 0 && `of ${availableWeeks.length} available`}
          </span>
          <button
            onClick={() => {
              const currentIndex = availableWeeks.indexOf(currentWeek);
              if (currentIndex < availableWeeks.length - 1 && currentIndex >= 0) {
                setCurrentWeek(availableWeeks[currentIndex + 1]);
              }
            }}
            disabled={availableWeeks.indexOf(currentWeek) >= availableWeeks.length - 1}
            className="px-3 py-1 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Deadline Warning */}
      {deadlineTime && (
        <div className={`mb-4 p-4 rounded-lg ${
          isPastDeadline 
            ? 'bg-red-500/20 border border-red-500/50' 
            : 'bg-blue-500/20 border border-blue-500/50'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{isPastDeadline ? '🔒' : '⏰'}</span>
            <span className="font-semibold">
              {isPastDeadline ? 'Picks Locked' : 'Picks Deadline'}
            </span>
          </div>
          <p className="text-sm text-slate-300">
            {isPastDeadline 
              ? 'The deadline has passed. You can no longer submit or change picks for this week.'
              : `Deadline: ${formatDeadline(deadlineTime)}`
            }
          </p>
        </div>
      )}

      {/* Pick Summary */}
      {hasUnlockedGames && !isPastDeadline && (
        <div className="mb-4 bg-slate-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">
              Picks Made: {picks.filter(p => p.selectedTeamId).length} / {games.filter(g => new Date(g.gameTime) > new Date()).length}
            </span>
            {allPicksMade && (
              <span className="text-green-400 flex items-center gap-1">
                <span className="text-green-400">✓</span> All picks complete
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {games.map(game => {
          const existingPick = picks.find(p => p.gameId === game.id);
          return (
            <PickCard 
              key={game.id} 
              game={game} 
              initialPick={existingPick?.selectedTeamId || null}
              onPickChange={handlePickChange}
              disabled={isPastDeadline}
            />
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Tie-Breaker</h2>
        <p className="text-sm text-slate-400 mb-4">
          Predict the total score for the Monday Night Football game.
        </p>
        <input
          type="number"
          value={tieBreaker ?? ''}
          onChange={(e) => setTieBreaker(parseInt(e.target.value, 10))}
          className="form-input w-full rounded-lg bg-slate-800/50 border-none text-white p-4"
          placeholder="Total score..."
          disabled={isPastDeadline}
        />
      </div>

      <div className="mt-8">
        <button
          onClick={handleSubmitPicks}
          disabled={saving || picks.length === 0 || isPastDeadline}
          className="w-full h-12 bg-primary rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : isPastDeadline ? 'Deadline Passed' : 'Submit Picks'}
        </button>
      </div>
    </div>
  );
}
