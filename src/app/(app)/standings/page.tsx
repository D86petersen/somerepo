"use client";

import { useState } from 'react';
import { standings as mockStandings } from '@/lib/mock-data';
import StandingRow from '@/components/StandingRow';

export default function StandingsPage() {
  const [activeTab, setActiveTab] = useState<'overall' | 'weekly'>('overall');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Standings</h1>

      <div className="flex mb-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('overall')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'overall' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
        >
          Overall
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'weekly' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
        >
          Weekly
        </button>
      </div>

      <div>
        <div className="flex items-center text-xs text-slate-400 uppercase mb-2 px-4">
          <div className="w-1/4 text-center">Rank</div>
          <div className="w-1/2">Name</div>
          <div className="w-1/4 text-right">Score</div>
        </div>
        {mockStandings.map(standing => (
          <StandingRow key={standing.rank} standing={standing} />
        ))}
      </div>
    </div>
  );
}
