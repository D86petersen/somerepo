"use client";

import { useState } from 'react';
import type { Game, Team } from '@/types';
import Image from 'next/image';

interface PickCardProps {
  game: Game;
  onPickChange: (gameId: string, selectedTeamId: string) => void;
}

export default function PickCard({ game, onPickChange }: PickCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handlePick = (team: Team) => {
    setSelectedTeam(team.id);
    onPickChange(game.id, team.id);
  };

  const isGameLocked = new Date(game.gameTime) < new Date();

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 mb-4 ${isGameLocked ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
        <span>{new Date(game.gameTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        {isGameLocked && <span className="font-bold text-red-500">Locked</span>}
      </div>
      <div className="flex justify-around items-center">
        <button
          onClick={() => handlePick(game.awayTeam)}
          disabled={isGameLocked}
          className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${selectedTeam === game.awayTeam.id ? 'bg-primary' : 'hover:bg-slate-700/50'}`}
        >
          <Image src={game.awayTeam.logoUrl} alt={game.awayTeam.name} width={60} height={60} />
          <span className="font-semibold">{game.awayTeam.name}</span>
        </button>
        <span className="text-slate-400">@</span>
        <button
          onClick={() => handlePick(game.homeTeam)}
          disabled={isGameLocked}
          className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${selectedTeam === game.homeTeam.id ? 'bg-primary' : 'hover:bg-slate-700/50'}`}
        >
          <Image src={game.homeTeam.logoUrl} alt={game.homeTeam.name} width={60} height={60} />
          <span className="font-semibold">{game.homeTeam.name}</span>
        </button>
      </div>
    </div>
  );
}
