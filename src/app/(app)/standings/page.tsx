"use client";

import { useState, useEffect } from 'react';
import { fetchStandings, subscribeToStandings } from '@/lib/supabase/queries';
import StandingRow from '@/components/StandingRow';
import type { UserStanding } from '@/types';

export default function StandingsPage() {
  const [activeTab, setActiveTab] = useState<'overall' | 'weekly'>('overall');
  const [standings, setStandings] = useState<UserStanding[]>([]);
  const [loading, setLoading] = useState(true);

  // Load standings
  useEffect(() => {
    async function loadStandings() {
      setLoading(true);
      const standingsData = await fetchStandings();
      setStandings(standingsData);
      setLoading(false);
    }

    loadStandings();
  }, [activeTab]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = subscribeToStandings(async () => {
      // Reload standings when picks change
      const standingsData = await fetchStandings();
      setStandings(standingsData);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading standings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        Standings
        <span className="flex items-center gap-1 text-xs font-normal text-green-400 bg-green-500/20 px-2 py-1 rounded">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </h1>

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

      {standings.length === 0 ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-400">No standings data available yet.</p>
          <p className="text-sm text-slate-500 mt-2">Make some picks to get started!</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center text-xs text-slate-400 uppercase mb-2 px-4">
            <div className="w-1/4 text-center">Rank</div>
            <div className="w-1/2">Name</div>
            <div className="w-1/4 text-right">Score</div>
          </div>
          {standings.map(standing => (
            <StandingRow key={standing.rank} standing={standing} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>
    </div>
  );
}
