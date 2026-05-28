'use client';
import Link from 'next/link';
import { Wallet, ChevronLeft } from 'lucide-react';
import { TODAY } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';

export default function Header() {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-sm ${lm ? 'bg-white/95 border-b border-slate-100' : 'bg-gray-950/95 border-b border-gray-800/50'}`}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`p-1 rounded-lg transition-colors ${lm ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-gray-500 hover:text-gray-300'}`}
            aria-label="강덕부로 돌아가기"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <Wallet className={`w-5 h-5 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
          <h1 className={`text-lg font-bold tracking-tight ${lm ? 'text-slate-900' : 'text-white'}`}>
            지출 트래커
          </h1>
        </div>
        <time className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>{TODAY}</time>
      </div>
    </header>
  );
}
