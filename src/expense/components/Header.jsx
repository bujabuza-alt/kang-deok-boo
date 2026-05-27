'use client';
import Link from 'next/link';
import { Wallet, ChevronLeft } from 'lucide-react';
import { TODAY } from '@/expense/utils';

export default function Header() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="p-1 text-gray-500 hover:text-gray-300 transition-colors" aria-label="강덕부로 돌아가기">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <Wallet className="w-5 h-5 text-violet-400" />
        <h1 className="text-lg font-bold tracking-tight">지출 트래커</h1>
      </div>
      <time className="text-xs text-gray-500">{TODAY}</time>
    </header>
  );
}
