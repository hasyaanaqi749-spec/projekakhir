'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Train,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Scan,
  User,
  Info,
} from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isFromAdmin = redirectParam.startsWith('/admin');
  const isFromPetugas = redirectParam.startsWith('/petugas');

  const handleQuickFill = (role: 'ADMIN' | 'PETUGAS' | 'PENUMPANG') => {
    setErrorMsg('');
    setSuccessMsg('');
    if (role === 'ADMIN') {
      setEmail('admin@kai.id');
      setPassword('admin123');
    } else if (role === 'PETUGAS') {
      setEmail('petugas.gmr@kai.id');
      setPassword('petugas123');
    } else {
      setEmail('budi@gmail.com');
      setPassword('budi123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Alamat email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Email atau kata sandi tidak valid.');
        setLoading(false);
        return;
      }

      setSuccessMsg(
        `Berhasil masuk sebagai ${data.user.nama} (${data.user.role}). Mengalihkan...`
      );

      try {
        const userObjStr = JSON.stringify(data.user);
        localStorage.setItem('railink_user', userObjStr);
        localStorage.setItem('user', userObjStr);
        sessionStorage.setItem('railink_user', userObjStr);
        sessionStorage.setItem('user', userObjStr);
      } catch {
        // Abaikan jika storage diblokir
      }

      let destination = '/';
      const userRole = data.user.role;

      if (userRole === 'ADMIN') {
        destination = redirectParam.startsWith('/admin') ? redirectParam : '/admin';
      } else if (userRole === 'PETUGAS') {
        destination = redirectParam.startsWith('/petugas') ? redirectParam : '/petugas';
      } else {
        if (redirectParam.startsWith('/admin') || redirectParam.startsWith('/petugas')) {
          destination = '/';
        } else {
          destination = redirectParam || '/';
        }
      }

      setTimeout(() => {
        window.location.href = destination;
      }, 250);
    } catch {
      setErrorMsg('Terjadi kendala jaringan saat menghubungi server. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-10 font-sans text-slate-100 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="group inline-flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-blue-700 text-white shadow-xl shadow-orange-500/20 transition-transform group-hover:scale-105">
            <Train className="h-7 w-7" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white transition-colors group-hover:text-amber-400">
            Railink<span className="text-amber-500">.</span>
          </span>
        </Link>
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Sistem Informasi Kereta Api • Kelompok 14
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="relative space-y-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 px-6 py-8 shadow-2xl sm:px-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>

          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Selamat Datang
            </h2>
            <p className="text-xs text-slate-400">
              Masuk ke portal akun Railink untuk mengelola atau memesan tiket.
            </p>
          </div>

          {(isFromAdmin || isFromPetugas) && !errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/40 bg-blue-950/40 p-3.5 text-xs text-blue-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <span>
                {isFromAdmin
                  ? 'Silakan masuk dengan akun Admin untuk mengelola portal dashboard.'
                  : 'Silakan masuk dengan akun Petugas untuk mengakses gate validasi.'}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></span>
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun Railink</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
            <span className="block text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pintasan Akun Uji Coba (Klik Langsung Isi):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('ADMIN')}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-2 text-center transition-colors hover:border-amber-500/60"
              >
                <div className="mb-0.5 flex items-center justify-center gap-1 text-xs font-bold text-amber-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </div>
                <span className="block truncate text-[10px] text-slate-500">
                  admin@kai.id
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('PETUGAS')}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-2 text-center transition-colors hover:border-emerald-500/60"
              >
                <div className="mb-0.5 flex items-center justify-center gap-1 text-xs font-bold text-emerald-400">
                  <Scan className="h-3.5 w-3.5" />
                  <span>Petugas</span>
                </div>
                <span className="block truncate text-[10px] text-slate-500">
                  petugas.gmr
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('PENUMPANG')}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-2 text-center transition-colors hover:border-blue-500/60"
              >
                <div className="mb-0.5 flex items-center justify-center gap-1 text-xs font-bold text-blue-400">
                  <User className="h-3.5 w-3.5" />
                  <span>Penumpang</span>
                </div>
                <span className="block truncate text-[10px] text-slate-500">
                  budi@gmail
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-center text-xs text-slate-400">
            <p>
              Belum punya akun penumpang?{' '}
              <Link href="/register" className="font-bold text-amber-400 hover:underline">
                Daftar sekarang
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors hover:text-amber-400"
            >
              <span>← Kembali ke Beranda Utama</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-xs text-slate-400">
          Memuat form login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}