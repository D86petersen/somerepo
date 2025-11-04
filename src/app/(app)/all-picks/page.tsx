"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getWeekDeadline, isPastDeadline as checkPastDeadline, formatDeadline } from '@/lib/deadline';
import Image from 'next/image';

interface UserPicks {
  userId: string;
  userName: string;
  userEmail: string;
  picks: {
    gameId: string;
    selectedTeamId: string;
    homeTeam: { id: string; name: string; logoUrl: string };
    awayTeam: { id: string; name: string; logoUrl: string };
    homeScore: number;
    awayScore: number;
    status: string;
    gameTime: string;
    isCorrect: boolean | null;
  }[];
  correctPicks: number;
  totalPicks: number;
}

export default function AllPicksPage() {
  const [allUserPicks, setAllUserPicks] = useState<UserPicks[]>([]);
  const [currentWeek, setCurrentWeek] = useState(10);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState<Date | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      
      // Get available weeks
      const { data: games } = await supabase
        .from('games')
        .select('week')
        .order('week');

      if (games && games.length > 0) {
        const weeks = [...new Set(games.map(g => g.week))].sort((a, b) => a - b);
        setAvailableWeeks(weeks);
        setCurrentWeek(weeks[weeks.length - 1]); // Default to latest week
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadAllPicks() {
      if (!currentWeek) return;
      
      setLoading(true);
      const supabase = createClient();

      try {
        // First, get all games for the week to check deadline
        const { data: weekGames } = await supabase
          .from('games')
          .select('game_time')
          .eq('week', currentWeek)
          .order('game_time', { ascending: true });

        // Calculate deadline: Thursday at 12pm Pacific before the week's games
        if (weekGames && weekGames.length > 0) {
          const deadline = getWeekDeadline(weekGames);
          setDeadlineTime(deadline);
          setIsPastDeadline(checkPastDeadline(deadline));
        }

        // Get all users who have made picks
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
              game_time,
              home_team:teams!games_home_team_id_fkey(id, name, logo_url),
              away_team:teams!games_away_team_id_fkey(id, name, logo_url)
            )
          `);

        if (!picksData) {
          setLoading(false);
          return;
        }

        // Filter by current week and group by user
        const userPicksMap = new Map<string, UserPicks>();

        picksData.forEach((pick: any) => {
          if (pick.game.week !== currentWeek) return;

          const userId = pick.user.id;
          const userName = pick.user.full_name || pick.user.email.split('@')[0];
          const userEmail = pick.user.email;

          if (!userPicksMap.has(userId)) {
            userPicksMap.set(userId, {
              userId,
              userName,
              userEmail,
              picks: [],
              correctPicks: 0,
              totalPicks: 0,
            });
          }

          const userPicks = userPicksMap.get(userId)!;
          
          // Determine if pick is correct (only for completed games)
          let isCorrect: boolean | null = null;
          if (pick.game.status === 'final') {
            const homeWon = pick.game.home_score > pick.game.away_score;
            const awayWon = pick.game.away_score > pick.game.home_score;
            
            if (homeWon && pick.selected_team_id === pick.game.home_team.id) {
              isCorrect = true;
            } else if (awayWon && pick.selected_team_id === pick.game.away_team.id) {
              isCorrect = true;
            } else {
              isCorrect = false;
            }

            if (isCorrect) userPicks.correctPicks++;
            userPicks.totalPicks++;
          }

          userPicks.picks.push({
            gameId: pick.game.id,
            selectedTeamId: pick.selected_team_id,
            homeTeam: {
              id: pick.game.home_team.id,
              name: pick.game.home_team.name,
              logoUrl: pick.game.home_team.logo_url,
            },
            awayTeam: {
              id: pick.game.away_team.id,
              name: pick.game.away_team.name,
              logoUrl: pick.game.away_team.logo_url,
            },
            homeScore: pick.game.home_score,
            awayScore: pick.game.away_score,
            status: pick.game.status,
            gameTime: pick.game.game_time,
            isCorrect,
          });
        });

        // Convert to array and sort by correct picks (descending)
        const userPicksArray = Array.from(userPicksMap.values()).sort(
          (a, b) => b.correctPicks - a.correctPicks
        );

        setAllUserPicks(userPicksArray);
      } catch (error) {
        console.error('Error loading picks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAllPicks();
  }, [currentWeek]);

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!currentWeek) return;

    const supabase = createClient();
    
    // Subscribe to game updates for the current week
    const channel = supabase
      .channel(`games-week-${currentWeek}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `week=eq.${currentWeek}`,
        },
        (payload) => {
          console.log('Game updated:', payload);
          // Reload all picks when games change
          loadAllPicksData();
        }
      )
      .subscribe();

    async function loadAllPicksData() {
      try {
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
              game_time,
              home_team:teams!games_home_team_id_fkey(id, name, logo_url),
              away_team:teams!games_away_team_id_fkey(id, name, logo_url)
            )
          `);

        if (!picksData) return;

        // Filter by current week and group by user
        const userPicksMap = new Map<string, UserPicks>();

        picksData.forEach((pick: any) => {
          if (pick.game.week !== currentWeek) return;

          const userId = pick.user.id;
          const userName = pick.user.full_name || pick.user.email.split('@')[0];
          const userEmail = pick.user.email;

          if (!userPicksMap.has(userId)) {
            userPicksMap.set(userId, {
              userId,
              userName,
              userEmail,
              picks: [],
              correctPicks: 0,
              totalPicks: 0,
            });
          }

          const userPicks = userPicksMap.get(userId)!;
          
          // Determine if pick is correct (only for completed games)
          let isCorrect: boolean | null = null;
          if (pick.game.status === 'final') {
            const homeWon = pick.game.home_score > pick.game.away_score;
            const awayWon = pick.game.away_score > pick.game.home_score;
            
            if (homeWon && pick.selected_team_id === pick.game.home_team.id) {
              isCorrect = true;
            } else if (awayWon && pick.selected_team_id === pick.game.away_team.id) {
              isCorrect = true;
            } else {
              isCorrect = false;
            }

            if (isCorrect) userPicks.correctPicks++;
            userPicks.totalPicks++;
          }

          userPicks.picks.push({
            gameId: pick.game.id,
            selectedTeamId: pick.selected_team_id,
            homeTeam: {
              id: pick.game.home_team.id,
              name: pick.game.home_team.name,
              logoUrl: pick.game.home_team.logo_url,
            },
            awayTeam: {
              id: pick.game.away_team.id,
              name: pick.game.away_team.name,
              logoUrl: pick.game.away_team.logo_url,
            },
            homeScore: pick.game.home_score,
            awayScore: pick.game.away_score,
            status: pick.game.status,
            gameTime: pick.game.game_time,
            isCorrect,
          });
        });

        // Convert to array and sort by correct picks (descending)
        const userPicksArray = Array.from(userPicksMap.values()).sort(
          (a, b) => b.correctPicks - a.correctPicks
        );

        setAllUserPicks(userPicksArray);
      } catch (error) {
        console.error('Error reloading picks:', error);
      }
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWeek]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading all picks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Week Selector */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            All Picks - Week {currentWeek}
            {isPastDeadline && (
              <span className="flex items-center gap-1 text-xs font-normal text-green-400 bg-green-500/20 px-2 py-1 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
          </h1>
        </div>
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
          <span className="text-sm text-slate-400">Week {currentWeek}</span>
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

      {/* Deadline Check - Only show picks if past deadline */}
      {!isPastDeadline ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Picks Locked Until Deadline</h2>
          <p className="text-slate-400 mb-4">
            All user picks will be revealed when the first game starts.
          </p>
          {deadlineTime && (
            <div className="bg-slate-700/50 rounded-lg p-4 inline-block">
              <p className="text-sm text-slate-400">Deadline:</p>
              <p className="text-lg font-semibold text-primary">
                {deadlineTime.toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </p>
            </div>
          )}
          <p className="text-sm text-slate-500 mt-4">
            Check back after the deadline to see everyone&apos;s picks!
          </p>
        </div>
      ) : allUserPicks.length === 0 ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-400">No picks have been made for Week {currentWeek} yet.</p>
          <p className="text-sm text-slate-500 mt-2">Be the first to make your picks!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {allUserPicks.map((userPicks, index) => (
            <div key={userPicks.userId} className="bg-slate-800/50 rounded-lg p-4">
              {/* User Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {index === 0 && <span className="text-yellow-400">🏆</span>}
                    {index === 1 && <span className="text-slate-300">🥈</span>}
                    {index === 2 && <span className="text-orange-600">🥉</span>}
                    {userPicks.userName}
                  </h3>
                  <p className="text-xs text-slate-400">{userPicks.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">
                    {userPicks.correctPicks}/{userPicks.totalPicks}
                  </p>
                  <p className="text-xs text-slate-400">
                    {userPicks.totalPicks > 0 
                      ? `${Math.round((userPicks.correctPicks / userPicks.totalPicks) * 100)}%` 
                      : '0%'}
                  </p>
                </div>
              </div>

              {/* User's Picks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userPicks.picks.map((pick) => {
                  const homeSelected = pick.selectedTeamId === pick.homeTeam.id;
                  const awaySelected = pick.selectedTeamId === pick.awayTeam.id;
                  
                  return (
                    <div
                      key={pick.gameId}
                      className={`p-3 rounded-lg border-2 ${
                        pick.isCorrect === true ? 'border-green-500 bg-green-500/10' :
                        pick.isCorrect === false ? 'border-red-500 bg-red-500/10' :
                        'border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Away Team */}
                        <div className={`flex items-center gap-2 flex-1 ${awaySelected ? 'opacity-100' : 'opacity-50'}`}>
                          <Image 
                            src={pick.awayTeam.logoUrl} 
                            alt={pick.awayTeam.name} 
                            width={32} 
                            height={32}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{pick.awayTeam.name}</p>
                            {pick.status !== 'upcoming' && (
                              <p className="text-xs text-slate-400">{pick.awayScore}</p>
                            )}
                          </div>
                          {awaySelected && <span className="text-green-400 text-lg">✓</span>}
                        </div>

                        <span className="text-slate-500 text-sm">@</span>

                        {/* Home Team */}
                        <div className={`flex items-center gap-2 flex-1 justify-end ${homeSelected ? 'opacity-100' : 'opacity-50'}`}>
                          {homeSelected && <span className="text-green-400 text-lg">✓</span>}
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-semibold truncate">{pick.homeTeam.name}</p>
                            {pick.status !== 'upcoming' && (
                              <p className="text-xs text-slate-400">{pick.homeScore}</p>
                            )}
                          </div>
                          <Image 
                            src={pick.homeTeam.logoUrl} 
                            alt={pick.homeTeam.name} 
                            width={32} 
                            height={32}
                          />
                        </div>
                      </div>

                      {/* Result Badge */}
                      {pick.isCorrect !== null && (
                        <div className={`mt-2 text-center text-xs font-bold ${
                          pick.isCorrect ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {pick.isCorrect ? '✓ Correct' : '✗ Wrong'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
