"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [gameReminders, setGameReminders] = useState(true);
  const [weeklyResults, setWeeklyResults] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [rules, setRules] = useState<string>('');
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    const loadRules = async () => {
      const { data } = await supabase
        .from('pool_settings')
        .select('rules')
        .single();
      
      if (data?.rules) {
        setRules(data.rules);
      }
    };
    
    getUser();
    loadRules();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSyncGames = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/sync-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (response.ok) {
        setSyncMessage(`✓ Synced ${data.games} games for Week ${data.week}`);
      } else {
        setSyncMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setSyncMessage('✗ Failed to sync games');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Settings & Rules</h1>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        {user && (
          <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src={user.user_metadata.avatar_url || '/avatars/default.svg'} alt={user.user_metadata.full_name || 'User'} width={48} height={48} className="rounded-full" />
              <div>
                <p className="font-semibold">{user.user_metadata.full_name || 'User'}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <button className="text-primary font-semibold">Edit</button>
          </div>
        )}

        {/* Admin Section - Sync Games */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">Admin</h2>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin')}
              className="w-full bg-slate-800/50 rounded-lg p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <span>Admin Panel</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>

        {/* Pool Rules */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">Pool Rules</h2>
          <div className="space-y-2">
            <div 
              onClick={() => setShowRules(!showRules)}
              className="bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <span>📜</span>
                  <p className="font-semibold">Pool Rules & Scoring</p>
                </div>
                <span className="transform transition-transform">{showRules ? '▼' : '›'}</span>
              </div>
              {showRules && rules && (
                <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-300 whitespace-pre-wrap">
                  {rules}
                </div>
              )}
              {showRules && !rules && (
                <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400 italic">
                  No rules have been set yet. Contact your pool administrator.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">Notifications</h2>
          <div className="space-y-2">
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
              <p>Game Reminders</p>
              <button onClick={() => setGameReminders(!gameReminders)} className={`w-12 h-6 rounded-full transition-colors ${gameReminders ? 'bg-primary' : 'bg-slate-700'}`}>
                <span className={`block w-6 h-6 rounded-full bg-white transform transition-transform ${gameReminders ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
              <p>Weekly Results</p>
              <button onClick={() => setWeeklyResults(!weeklyResults)} className={`w-12 h-6 rounded-full transition-colors ${weeklyResults ? 'bg-primary' : 'bg-slate-700'}`}>
                <span className={`block w-6 h-6 rounded-full bg-white transform transition-transform ${weeklyResults ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">Account</h2>
          <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800">
            <div className="flex items-center gap-4">
              <span>🔒</span>
              <p>Change Password</p>
            </div>
            <span>›</span>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center h-12 bg-primary rounded-lg font-semibold"
          >
            Log Out
          </button>
          <button className="w-full text-center text-red-500 mt-4">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

