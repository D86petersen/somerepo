"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface WeeklyWinner {
  week: number;
  userId: string;
  userName: string;
  userEmail: string;
  correctPicks: number;
  totalPicks: number;
  percentage: number;
  tieBreaker?: number;
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<WeeklyWinner[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      
      // Get weeks with completed games
      const { data: games } = await supabase
        .from('games')
        .select('week')
        .eq('status', 'final')
        .order('week');

      if (games && games.length > 0) {
        const weeks = [...new Set(games.map(g => g.week))].sort((a, b) => b - a);
        setAvailableWeeks(weeks);
        setSelectedWeek(weeks[0]); // Most recent completed week
      }

      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;

    async function loadWinner() {
      const supabase = createClient();

      try {
        // First, get all games for the selected week that are final
        const { data: gamesData } = await supabase
          .from('games')
          .select('id')
          .eq('week', selectedWeek)
          .eq('status', 'final');

        if (!gamesData || gamesData.length === 0) {
          setWinners([]);
          return;
        }

        const gameIds = gamesData.map(g => g.id);

        // Get all picks for these completed games
        const { data: picksData } = await supabase
          .from('picks')
          .select(`
            *,
            user:users(id, email, full_name),
            game:games(
              id,
              week,
              home_score,
              away_score,
              status,
              home_team:teams!games_home_team_id_fkey(id),
              away_team:teams!games_away_team_id_fkey(id)
            )
          `)
          .in('game_id', gameIds);

        if (!picksData || picksData.length === 0) {
          setWinners([]);
          return;
        }

        // Calculate scores for each user
        const userScores = new Map<string, WeeklyWinner>();

        picksData.forEach((pick: any) => {
          if (!pick.game || pick.game.week !== selectedWeek) return;

          const userId = pick.user.id;
          const userName = pick.user.full_name || pick.user.email.split('@')[0];
          const userEmail = pick.user.email;

          if (!userScores.has(userId)) {
            userScores.set(userId, {
              week: selectedWeek!,
              userId,
              userName,
              userEmail,
              correctPicks: 0,
              totalPicks: 0,
              percentage: 0,
              tieBreaker: pick.tie_breaker,
            });
          }

          const userScore = userScores.get(userId)!;
          userScore.totalPicks++;

          // Check if pick was correct
          const homeWon = pick.game.home_score > pick.game.away_score;
          const awayWon = pick.game.away_score > pick.game.home_score;

          if (
            (homeWon && pick.selected_team_id === pick.game.home_team.id) ||
            (awayWon && pick.selected_team_id === pick.game.away_team.id)
          ) {
            userScore.correctPicks++;
          }
        });

        // Convert to array and calculate percentages
        const winnersArray = Array.from(userScores.values()).map(user => ({
          ...user,
          percentage: user.totalPicks > 0 ? (user.correctPicks / user.totalPicks) * 100 : 0,
        }));

        // Sort by correct picks (descending), then by tie breaker if needed
        winnersArray.sort((a, b) => {
          if (b.correctPicks !== a.correctPicks) {
            return b.correctPicks - a.correctPicks;
          }
          // If tied, could use tie breaker logic here
          return 0;
        });

        setWinners(winnersArray);
      } catch (error) {
        console.error('Error loading winners:', error);
      }
    }

    loadWinner();
  }, [selectedWeek]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading winners...</p>
        </div>
      </div>
    );
  }

  if (availableWeeks.length === 0) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold mb-6">Weekly Winners 🏆</h1>
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">No completed weeks yet.</p>
          <p className="text-sm text-slate-500">Winners will appear once games are completed!</p>
        </div>
      </div>
    );
  }

  const winner = winners[0];
  const runnerUp = winners[1];
  const thirdPlace = winners[2];

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Weekly Winners 🏆
      </h1>

      {/* Week Selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-slate-400">Select Week:</label>
        <select
          value={selectedWeek || ''}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          className="bg-slate-700 rounded-lg px-4 py-2 text-white"
        >
          {availableWeeks.map((week) => (
            <option key={week} value={week}>
              Week {week}
            </option>
          ))}
        </select>
      </div>

      {winners.length === 0 ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-400">No data available for Week {selectedWeek}.</p>
        </div>
      ) : (
        <>
          {/* Winner Celebration */}
          {winner && (
            <div className="relative mb-8 overflow-hidden">
              {/* Confetti Animation */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10px',
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`,
                    }}
                  >
                    {['🎉', '🎊', '⭐', '✨', '🏆'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>

              {/* Winner Card */}
              <div className="relative bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4 animate-bounce">🏆</div>
                <h2 className="text-4xl font-bold mb-2 text-yellow-400">
                  {winner.userName}
                </h2>
                <p className="text-xl text-slate-300 mb-4">Week {selectedWeek} Champion!</p>
                
                <div className="flex justify-center gap-8 mb-4">
                  <div>
                    <p className="text-4xl font-bold text-green-400">
                      {winner.correctPicks}
                    </p>
                    <p className="text-sm text-slate-400">Correct Picks</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-400">
                      {winner.percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-slate-400">Accuracy</p>
                  </div>
                </div>

                <div className="text-2xl mb-2">🎊 🎉 🎊</div>
                <p className="text-lg text-yellow-300 font-semibold">
                  Congratulations on an amazing week!
                </p>
              </div>
            </div>
          )}

          {/* Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            {runnerUp && (
              <div className="bg-slate-800/50 border-2 border-slate-400 rounded-lg p-6 text-center order-2 md:order-1">
                <div className="text-4xl mb-2">🥈</div>
                <h3 className="text-xl font-bold mb-1">{runnerUp.userName}</h3>
                <p className="text-sm text-slate-400 mb-3">2nd Place</p>
                <p className="text-2xl font-bold text-slate-300">
                  {runnerUp.correctPicks}/{runnerUp.totalPicks}
                </p>
                <p className="text-sm text-slate-400">
                  {runnerUp.percentage.toFixed(1)}%
                </p>
              </div>
            )}

            {/* 1st Place (already shown above, placeholder for grid) */}
            <div className="hidden md:block order-1 md:order-2"></div>

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="bg-slate-800/50 border-2 border-orange-700 rounded-lg p-6 text-center order-3">
                <div className="text-4xl mb-2">🥉</div>
                <h3 className="text-xl font-bold mb-1">{thirdPlace.userName}</h3>
                <p className="text-sm text-slate-400 mb-3">3rd Place</p>
                <p className="text-2xl font-bold text-orange-600">
                  {thirdPlace.correctPicks}/{thirdPlace.totalPicks}
                </p>
                <p className="text-sm text-slate-400">
                  {thirdPlace.percentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Full Leaderboard */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Full Leaderboard</h3>
            <div className="space-y-2">
              {winners.map((user, index) => (
                <div
                  key={user.userId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : index === 1
                      ? 'bg-slate-400/10 border border-slate-400/30'
                      : index === 2
                      ? 'bg-orange-600/10 border border-orange-600/30'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-8 text-center">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{user.userName}</p>
                      <p className="text-xs text-slate-400">{user.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">
                      {user.correctPicks}/{user.totalPicks}
                    </p>
                    <p className="text-sm text-slate-400">
                      {user.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
