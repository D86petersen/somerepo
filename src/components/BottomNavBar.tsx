"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/picks', icon: 'sports_football', label: 'Picks' },
  { href: '/standings', icon: 'leaderboard', label: 'Standings' },
  { href: '/schedule', icon: 'event', label: 'Schedule' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background-dark border-t border-slate-700 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link href={item.href} key={item.label} className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
