"use client";

import { useState, useEffect } from 'react';
import { games as initialGames } from '@/lib/mock-data';
import GameCard from '@/components/GameCard';
import type { Game } from '@/types';

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>(initialGames.filter(g => g.week === 1));

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setGames(prevGames => {
        return prevGames.map(game => {
          if (game.status === 'live') {
            const scoreChange = Math.random() > 0.8;
            if (scoreChange) {
              const teamToScore = Math.random() > 0.5 ? 'home' : 'away';
              return {
                ...game,
                [`${teamToScore}Score`]: game[`${teamToScore}Score`] + (Math.random() > 0.9 ? 3 : 7),
              };
            }
          }
          return game;
        });
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Week 1</h1>
        {/* Week selector will go here */}
      </div>
      <div>
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
