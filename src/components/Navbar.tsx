'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface CurrentUser {
  id?: string;
  nama?: string;
  email?: string;
  role?: string;
}

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // Baca status user dari localStorage
    try {
      const saved = localStorage.getItem('railink_user') || localStorage.getItem('user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('railink_user');
    localStorage.removeItem('user');
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setCurrentUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Railink */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              🚆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Railink</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  KAI - Kelompok 14
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Sistem Informasi Tiket Kereta Api</p>
            </div>
          </Link>

          {/* Menu Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname === '/' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/jadwal"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname === '/jadwal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cari Tiket
            </Link>
            <Link
              href="/booking/RLK-88219"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname.startsWith('/booking') ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cek E-Tiket
            </Link>
            <Link
              href="/petugas/validasi"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname.startsWith('/petugas') ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              Gate Petugas
            </Link>
            <Link
              href="/admin"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname.startsWith('/admin') ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:text-white hover:bg-amber-950/40'
              }`}
            >
              Portal Admin
            </Link>
          </nav>

          {/* User Status / Login */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-xs font-bold text-white">{currentUser.nama || 'User'}</p>
                  <p className="text-[10px] text-amber-400 font-mono uppercase">{currentUser.role || 'PENUMPANG'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold rounded-lg transition"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
              >
                Masuk / Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-2">
            <Link href="/" className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              Beranda
            </Link>
            <Link href="/jadwal" className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              Cari Tiket
            </Link>
            <Link href="/booking/RLK-88219" className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              Cek E-Tiket
            </Link>
            <Link href="/petugas/validasi" className="block px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-slate-800">
              Gate Petugas
            </Link>
            <Link href="/admin" className="block px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-slate-800">
              Portal Admin
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// Komponen Pembungkus Suspense yang Di-ekspor (Bebas dari error usePathname)
export const Navbar: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="h-16 bg-slate-900 border-b border-slate-800 w-full flex items-center px-6">
          <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
      }
    >
      <NavbarContent />
    </Suspense>
  );
};

export default Navbar;