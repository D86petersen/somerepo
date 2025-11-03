"use client";

import { useState } from 'react';
import { games as allGames } from '@/lib/mock-data';
import PickCard from '@/components/PickCard';
import type { UserPick } from '@/types';

export default function PicksPage() {
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [tieBreaker, setTieBreaker] = useState<number | null>(null);
  const weekGames = allGames.filter(game => game.week === 1);

  const handlePickChange = (gameId: string, selectedTeamId: string) => {
    setPicks(prevPicks => {
      const existingPick = prevPicks.find(p => p.gameId === gameId);
      if (existingPick) {
        return prevPicks.map(p => p.gameId === gameId ? { ...p, selectedTeamId } : p);
      }
      return [...prevPicks, { gameId, selectedTeamId, tieBreaker: null }];
    });
  };

  const handleSubmitPicks = () => {
    // In a real application, you would save the picks to the database.
    // For now, we'll just log them to the console.
    console.log({ picks, tieBreaker });
    alert('Picks submitted!');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Week 1 Picks</h1>
        {/* Week selector can go here */}
      </div>

      <div className="space-y-4">
        {weekGames.map(game => (
          <PickCard key={game.id} game={game} onPickChange={handlePickChange} />
        ))}
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
        />
      </div>

      <div className="mt-8">
        <button
          onClick={handleSubmitPicks}
          className="w-full h-12 bg-primary rounded-lg font-semibold"
        >
          Submit Picks
        </button>
      </div>
    </div>
  );
}
