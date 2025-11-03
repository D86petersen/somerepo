import type { Game } from '@/types';
import Image from 'next/image';

export default function GameCard({ game }: { game: Game }) {
  const { homeTeam, awayTeam, gameTime, status, homeScore, awayScore, quarter, timeRemaining } = game;

  const gameDate = new Date(gameTime);
  const gameDay = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const gameClock = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const isLive = status === 'live';
  const isFinal = status === 'final';
  const homeWinning = homeScore > awayScore;
  const awayWinning = awayScore > homeScore;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 mb-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs text-slate-400">
          {gameDay} • {gameClock}
        </div>
        <div className={`text-xs font-bold flex items-center gap-1 ${
          isLive ? 'text-red-500' : isFinal ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          {status === 'upcoming' && 'Upcoming'}
          {isLive && quarter && `${quarter}${timeRemaining ? ` - ${timeRemaining}` : ''}`}
          {isFinal && 'Final'}
        </div>
      </div>

      {/* Teams and Score */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Image 
              src={awayTeam.logoUrl} 
              alt={awayTeam.name} 
              width={40} 
              height={40}
              className="flex-shrink-0"
            />
            <span className={`font-semibold ${awayWinning && isFinal ? 'text-green-400' : ''}`}>
              {awayTeam.name}
            </span>
          </div>
          <div className={`text-2xl font-bold min-w-[3rem] text-right ${
            awayWinning ? 'text-green-400' : 'text-slate-400'
          }`}>
            {awayScore ?? '-'}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Image 
              src={homeTeam.logoUrl} 
              alt={homeTeam.name} 
              width={40} 
              height={40}
              className="flex-shrink-0"
            />
            <span className={`font-semibold ${homeWinning && isFinal ? 'text-green-400' : ''}`}>
              {homeTeam.name}
            </span>
          </div>
          <div className={`text-2xl font-bold min-w-[3rem] text-right ${
            homeWinning ? 'text-green-400' : 'text-slate-400'
          }`}>
            {homeScore ?? '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
