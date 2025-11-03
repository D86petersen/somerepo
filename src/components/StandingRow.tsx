import type { UserStanding } from '@/types';

export default function StandingRow({ standing }: { standing: UserStanding }) {
  const { rank, name, score } = standing;

  return (
    <div className="flex items-center bg-slate-800/50 rounded-lg p-4 mb-2">
      <div className="w-1/4 text-center text-lg font-bold">{rank}</div>
      <div className="w-1/2">{name}</div>
      <div className="w-1/4 text-right font-semibold">{score}</div>
    </div>
  );
}
