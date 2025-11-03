import type { Game } from '@/types';
import Image from 'next/image';

export default function GameCard({ game }: { game: Game }) {
  const { homeTeam, awayTeam, gameTime, status, homeScore, awayScore, quarter, timeRemaining } = game;

  const gameDate = new Date(gameTime);
  const gameDay = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const gameClock = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xs text-slate-400">
          {gameDay} - {gameClock}
        </div>
        <div className={`text-xs font-bold ${status === 'live' ? 'text-red-500' : 'text-slate-400'}`}>
          {status === 'upcoming' && 'Upcoming'}
          {status === 'live' && `${quarter} - ${timeRemaining}`}
          {status === 'final' && 'Final'}
        </div>
      </div>
      <div className="flex items-center">
        <div className="w-1/3 flex items-center gap-2">
          <Image src={awayTeam.logoUrl} alt={awayTeam.name} width={40} height={40} />
          <span className="font-semibold">{awayTeam.name}</span>
        </div>
        <div className="w-1/3 text-center text-2xl font-bold">
          {awayScore} @ {homeScore}
        </div>
        <div className="w-1/3 flex items-center gap-2 justify-end">
          <span className="font-semibold">{homeTeam.name}</span>
          <Image src={homeTeam.logoUrl} alt={homeTeam.name} width={40} height={40} />
        </div>
      </div>
    </div>
  );
}
