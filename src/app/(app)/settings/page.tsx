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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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

        {/* Pool Rules Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">Pool Rules</h2>
          <div className="space-y-2">
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined">help</span>
                <p>How to Play</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined">emoji_events</span>
                <p>Scoring System</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined">schedule</span>
                <p>Deadlines & Lock Times</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
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
              <span className="material-symbols-outlined">lock</span>
              <p>Change Password</p>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
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
