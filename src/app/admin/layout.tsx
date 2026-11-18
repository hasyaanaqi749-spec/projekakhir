'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    nama?: string;
    email?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const user = data?.user;
          if (user && user.role === 'ADMIN') {
            if (active) setCurrentUser(user);
            return;
          }
          if (user && user.role !== 'ADMIN') {
            router.replace('/login?redirect=' + encodeURIComponent(pathname || '/admin'));
            return;
          }
        }

        const savedUser =
          localStorage.getItem('railink_user') || localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if ((parsed.role || '').toUpperCase() === 'ADMIN') {
            if (active) setCurrentUser(parsed);
            return;
          }
        }

        router.replace('/login?redirect=' + encodeURIComponent(pathname || '/admin'));
      } catch {
        // Tetap render children agar segment Next.js tidak terputus
      } finally {
        if (active) setCheckingAuth(false);
      }
    };

    checkSession();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Abaikan error network
    }
    localStorage.removeItem('railink_user');
    localStorage.removeItem('user');
    sessionStorage.removeItem('railink_user');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Master Stasiun',
      href: '/admin/stasiun',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m4 0h1m-5 4h1m4 0h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Master Kereta & Gerbong',
      href: '/admin/kereta',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 4h8m-6 4h4M6 3h12a2 2 0 012 2v11a3 3 0 01-3 3H7a3 3 0 01-3-3V5a2 2 0 012-2zm1 16l-2 2m12-2l2 2" />
        </svg>
      ),
    },
    {
      label: 'Master Rute & Jadwal',
      href: '/admin/jadwal',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Kelola Tarif',
      href: '/admin/tarif',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Laporan Pemesanan',
      href: '/admin/laporan',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 md:flex-row">
      {/* Sidebar Navigasi Admin */}
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-900 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20">
              KAI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Railink
                </span>
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">Portal Kelompok 14</p>
            </div>
          </div>

          {/* Toggle Menu Admin di HP */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 md:hidden"
          >
            {mobileNavOpen ? 'Tutup Menu' : 'Menu Admin'}
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } flex-1 space-y-1.5 p-4 md:block`}
        >
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Manajemen Operasional
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 font-bold text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } border-t border-slate-800 bg-slate-900/60 p-4 md:block`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-amber-400">
                AD
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {currentUser?.nama || 'Administrator'}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {currentUser?.email || 'admin@kai.id'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 rounded-lg bg-slate-800 py-1.5 text-center text-xs font-medium text-slate-300 transition hover:bg-slate-700"
            >
              Ke Web Utama
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/60"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-slate-950">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 backdrop-blur sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
            <span className="truncate text-xs font-medium text-slate-400">
              Server Status: Online
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Role: <span className="font-semibold text-amber-400">ADMIN</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {checkingAuth && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-400">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
              <span>Menyiapkan sesi administrator...</span>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}