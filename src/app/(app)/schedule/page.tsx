"use client";

import { useState, useEffect } from 'react';
import { fetchGames, subscribeToGames } from '@/lib/supabase/queries';
import { getCurrentNFLWeek } from '@/lib/nfl-api';
import GameCard from '@/components/GameCard';
import type { Game } from '@/types';

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [currentWeek, setCurrentWeek] = useState(10); // Default to week 10
  const [loading, setLoading] = useState(true);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Set initial week and find available weeks
  useEffect(() => {
    async function init() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Fetch all games to find which weeks have data
      const { data: allGames } = await supabase
        .from('games')
        .select('week')
        .order('week');

      if (allGames && allGames.length > 0) {
        const weeks = [...new Set(allGames.map(g => g.week))].sort((a, b) => a - b);
        setAvailableWeeks(weeks);
        setCurrentWeek(weeks[0]); // Start with first available week
      }
    }
    init();
  }, []);

  // Load games
  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      const gamesData = await fetchGames(currentWeek);
      setGames(gamesData);
      setLoading(false);
    }

    if (currentWeek > 0) {
      loadGames();
    }
  }, [currentWeek]);

  // Subscribe to real-time updates for live game scores
  useEffect(() => {
    const channel = subscribeToGames(currentWeek, undefined, async (payload) => {
      console.log('Game updated:', payload);
      
      // Reload games to get fresh data
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
          // Reload games after successful sync
          const gamesData = await fetchGames(currentWeek);
          setGames(gamesData);
          setLastSyncTime(new Date());
          console.log(`✅ Auto-synced Week ${currentWeek} at ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      } finally {
        setAutoSyncing(false);
      }
    }

    // Only auto-sync if there are games with live or upcoming status
    const hasLiveGames = games.some(g => g.status === 'live' || g.status === 'upcoming');
    
    if (hasLiveGames && currentWeek > 0) {
      // Initial sync
      syncWithESPN();
      
      // Set up interval for every 30 seconds
      intervalId = setInterval(syncWithESPN, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentWeek, games]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Week {currentWeek}</h1>
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-400">No games scheduled for this week yet.</p>
          <p className="text-sm text-slate-500 mt-2">Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Auto-sync indicator */}
      {games.some(g => g.status === 'live' || g.status === 'upcoming') && (
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
      )}

      {/* Week Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Week {currentWeek} Schedule
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
      
      <div className="space-y-2">
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      
      {games.some(g => g.status === 'live') && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Live updates enabled</span>
        </div>
      )}
    </div>
  );
}
