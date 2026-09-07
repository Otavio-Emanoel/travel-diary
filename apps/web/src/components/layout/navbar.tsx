'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, BookOpen, PlusCircle, LogOut, User, MapPin } from 'lucide-react';
import { useAuthStore } from '../../features/auth/auth-store';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
              Diário de Viagens
            </span>
            <span className="text-[10px] tracking-wider uppercase text-brand-600 font-semibold -mt-1">
              Travel Memoirs
            </span>
          </div>
        </Link>

        {/* Links de navegação */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/trips"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/trips') && pathname !== '/trips/new'
                    ? 'bg-stone-200/80 text-stone-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Minhas Viagens</span>
              </Link>

              <Link
                href="/trips/new"
                className="px-3.5 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all flex items-center gap-1.5 hover:shadow-brand-500/25"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Viagem</span>
              </Link>

              <div className="h-6 w-px bg-stone-300 mx-1.5" />

              <div className="flex items-center gap-2 pl-1">
                <span className="text-xs font-medium text-stone-700 hidden md:inline">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sair da conta"
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : !isLoading ? (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-sm transition-all"
              >
                Criar Conta
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
