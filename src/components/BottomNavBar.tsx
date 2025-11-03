"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/picks', icon: '🏈', label: 'Picks' },
  { href: '/all-picks', icon: '👥', label: 'All Picks' },
  { href: '/winners', icon: '🏆', label: 'Winners' },
  { href: '/standings', icon: '📊', label: 'Standings' },
  { href: '/schedule', icon: '📅', label: 'Schedule' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background-dark border-t border-slate-700 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link href={item.href} key={item.label} className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-slate-400'}`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
