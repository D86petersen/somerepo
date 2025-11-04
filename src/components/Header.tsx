'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  // Don't show header on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Set this to true if you have a logo image in /public/logo.png (or .svg)
  const hasLogoImage = false;
  const logoPath = '/logo.png'; // Update this to your logo filename

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/75">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/picks" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {hasLogoImage ? (
            <div className="flex items-center gap-3">
              <Image 
                src={logoPath} 
                alt="WiZiX Degenerates Logo" 
                width={40} 
                height={40}
                className="rounded"
              />
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
                  WiZiX
                </div>
                <div className="text-lg font-semibold text-slate-400">
                  Degenerates
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
                WiZiX
              </div>
              <div className="text-lg font-semibold text-slate-400">
                Degenerates
              </div>
            </div>
          )}
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">NFL Pool</span>
        </div>
      </div>
    </header>
  );
}
