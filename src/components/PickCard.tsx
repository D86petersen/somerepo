"use client";

import { useState, useEffect } from 'react';
import type { Game, Team } from '@/types';
import Image from 'next/image';

interface PickCardProps {
  game: Game;
  initialPick?: string | null;
  onPickChange: (gameId: string, selectedTeamId: string) => void;
  disabled?: boolean;
}

export default function PickCard({ game, initialPick, onPickChange, disabled = false }: PickCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialPick || null);

  // Update selected team if initial pick changes (e.g., from database)
  useEffect(() => {
    if (initialPick) {
      setSelectedTeam(initialPick);
    }
  }, [initialPick]);

  const handlePick = (team: Team) => {
    if (disabled || isGameLocked) return;
    setSelectedTeam(team.id);
    onPickChange(game.id, team.id);
  };

  const isGameLocked = new Date(game.gameTime) < new Date() || disabled;
  const isGameFinal = game.status === 'final';
  const isCorrectPick = isGameFinal && selectedTeam && (
    (game.homeScore > game.awayScore && selectedTeam === game.homeTeam.id) ||
    (game.awayScore > game.homeScore && selectedTeam === game.awayTeam.id)
  );
  const isWrongPick = isGameFinal && selectedTeam && !isCorrectPick;

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 mb-4 border-2 ${
      isCorrectPick ? 'border-green-500' : 
      isWrongPick ? 'border-red-500' : 
      'border-transparent'
    } ${isGameLocked ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center text-xs mb-3">
        <span className="text-slate-400">
          {new Date(game.gameTime).toLocaleString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit' 
          })}
        </span>
        <div className="flex items-center gap-2">
          {isGameFinal && selectedTeam && (
            <span className={`font-bold ${isCorrectPick ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrectPick ? '✓ Correct' : '✗ Wrong'}
            </span>
          )}
          {isGameLocked && !isGameFinal && (
            <span className="font-bold text-orange-500">🔒 Locked</span>
          )}
          {game.status === 'live' && (
            <span className="font-bold text-red-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
          {isGameFinal && (
            <span className="font-bold text-slate-400">Final</span>
          )}
        </div>
      </div>

      {/* Show scores for locked/final games */}
      {isGameLocked && (
        <div className="mb-3 text-center">
          <div className="flex items-center justify-center gap-4 text-2xl font-bold">
            <span className={game.awayScore > game.homeScore ? 'text-green-400' : ''}>{game.awayScore}</span>
            <span className="text-slate-600">-</span>
            <span className={game.homeScore > game.awayScore ? 'text-green-400' : ''}>{game.homeScore}</span>
          </div>
          {game.status === 'live' && game.quarter && (
            <div className="text-xs text-slate-400 mt-1">
              {game.quarter} {game.timeRemaining && `- ${game.timeRemaining}`}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-around items-center">
        <button
          onClick={() => handlePick(game.awayTeam)}
          disabled={isGameLocked}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
            selectedTeam === game.awayTeam.id 
              ? isCorrectPick 
                ? 'bg-green-600 ring-2 ring-green-400' 
                : isWrongPick 
                  ? 'bg-red-600/50 ring-2 ring-red-400' 
                  : 'bg-primary ring-2 ring-primary-light' 
              : 'hover:bg-slate-700/50'
          } ${isGameLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="relative">
            <Image 
              src={game.awayTeam.logoUrl} 
              alt={game.awayTeam.name} 
              width={60} 
              height={60}
              className={selectedTeam === game.awayTeam.id ? 'opacity-100' : 'opacity-70'}
            />
          </div>
          <span className={`font-semibold text-sm ${selectedTeam === game.awayTeam.id ? 'text-white' : 'text-slate-300'}`}>
            {game.awayTeam.name}
          </span>
        </button>
        
        <span className="text-slate-500 font-bold">@</span>
        
        <button
          onClick={() => handlePick(game.homeTeam)}
          disabled={isGameLocked}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
            selectedTeam === game.homeTeam.id 
              ? isCorrectPick 
                ? 'bg-green-600 ring-2 ring-green-400' 
                : isWrongPick 
                  ? 'bg-red-600/50 ring-2 ring-red-400' 
                  : 'bg-primary ring-2 ring-primary-light' 
              : 'hover:bg-slate-700/50'
          } ${isGameLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="relative">
            <Image 
              src={game.homeTeam.logoUrl} 
              alt={game.homeTeam.name} 
              width={60} 
              height={60}
              className={selectedTeam === game.homeTeam.id ? 'opacity-100' : 'opacity-70'}
            />
          </div>
          <span className={`font-semibold text-sm ${selectedTeam === game.homeTeam.id ? 'text-white' : 'text-slate-300'}`}>
            {game.homeTeam.name}
          </span>
        </button>
      </div>
    </div>
  );
}
