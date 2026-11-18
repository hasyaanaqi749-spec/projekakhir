'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Train,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (nama.trim().length < 3) {
      setErrorMsg('Nama lengkap minimal 3 karakter.');
      return;
    }
    if (phone.trim().length < 10) {
      setErrorMsg('Nomor telepon / WhatsApp minimal 10 digit.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: nama.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Pendaftaran gagal. Silakan periksa data Anda.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke beranda...');
      try {
        const userStr = JSON.stringify(data.user);
        localStorage.setItem('railink_user', userStr);
        localStorage.setItem('user', userStr);
      } catch {
        // Abaikan jika storage diblokir
      }

      const safeDest =
        redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : '/';

      setTimeout(() => {
        window.location.href = safeDest;
      }, 300);
    } catch {
      setErrorMsg('Terjadi kendala jaringan saat mendaftar.');
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
          Daftar Akun Penumpang • Kelompok 14
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Buat Akun Baru</h1>
            <p className="mt-1 text-xs text-slate-400">
              Daftar untuk memesan tiket kereta dan memantau riwayat e-tiket Anda.
            </p>
          </div>

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

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Sesuai KTP"
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                No. HP / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none sm:text-sm"
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-base text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-50"
            >
              <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-bold text-amber-400 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-xs text-slate-400">
          Memuat form pendaftaran...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}