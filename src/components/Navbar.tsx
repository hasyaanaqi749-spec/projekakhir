'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SessionUser {
  id: string;
  nama: string;
  email: string;
  role: 'PENUMPANG' | 'PETUGAS' | 'ADMIN';
}

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const resolved = data?.user ?? (data?.id ? data : null);
        setUser(resolved);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Abaikan error network, tetap bersihkan state client
    }
    setUser(null);
    setMobileMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/jadwal', label: 'Cari Tiket' },
    { href: '/dashboard', label: 'Tiket Saya' },
    { href: '/tiket', label: 'Cek E-Tiket' },
    { href: '/petugas', label: 'Gate Petugas' },
    { href: '/admin', label: 'Portal Admin' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 17l-2 4m10-4l2 4M6 3h12a2 2 0 012 2v9a3 3 0 01-3 3H7a3 3 0 01-3-3V5a2 2 0 012-2zm1 10h.01M17 13h.01M6 8h12"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                Railink
              </span>
              <span className="hidden rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 sm:inline-block">
                KAI - Kelompok 14
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-400">
              Sistem Informasi Tiket Kereta Api
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-amber-500 font-semibold text-slate-950'
                    : item.href === '/petugas'
                      ? 'text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-300'
                      : item.href === '/admin'
                        ? 'text-amber-400 hover:bg-slate-800/80 hover:text-amber-300'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth + Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 lg:flex">
            {loadingAuth ? (
              <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-800" />
            ) : user ? (
              <>
                <div className="text-right">
                  <p className="max-w-[170px] truncate text-xs font-semibold text-white">
                    {user.nama}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {user.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                >
                  Keluar
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu Navigasi"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:bg-slate-800 lg:hidden"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 pb-4 pt-3 lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-[42px] items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-medium transition ${
                    active
                      ? 'bg-amber-500 font-semibold text-slate-950'
                      : 'border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 border-t border-slate-800 pt-3">
            {user ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.nama}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {user.role} • {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[42px] items-center justify-center rounded-xl bg-amber-500 text-sm font-semibold text-slate-950"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense
      fallback={
        <div className="h-16 w-full border-b border-slate-800 bg-slate-950" />
      }
    >
      <NavbarContent />
    </Suspense>
  );
}

export default Navbar;