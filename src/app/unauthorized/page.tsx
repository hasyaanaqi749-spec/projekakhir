'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">
          Akses Terbatas (403)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Halaman tersebut khusus untuk akun dengan hak akses Admin atau Petugas Stasiun.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Beranda</span>
          </Link>
          <Link
            href="/login"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-amber-500 px-4 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Masuk Akun Lain
          </Link>
        </div>
      </div>
    </div>
  );
}