'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CekTiketPage() {
  const router = useRouter();
  const [kodeBooking, setKodeBooking] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCari = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = kodeBooking.trim().toUpperCase();
    if (!cleaned) {
      setErrorMsg('Masukkan kode booking terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/pemesanan/${encodeURIComponent(cleaned)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Kode booking tidak ditemukan di database.');
      }
      router.push(`/booking/${encodeURIComponent(cleaned)}`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Kode booking tidak ditemukan.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-extrabold text-white">Cek E-Tiket</h1>
          <p className="mt-1 text-sm text-slate-400">
            Masukkan kode booking Anda untuk melihat status pembayaran dan boarding pass.
          </p>

          <form onSubmit={handleCari} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Kode Booking
              </label>
              <input
                type="text"
                placeholder="Contoh: KAI-7A89X"
                value={kodeBooking}
                onChange={(e) => setKodeBooking(e.target.value)}
                className="min-h-[46px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base uppercase tracking-wider text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-[46px] w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? 'Mencari di Database...' : 'Tampilkan E-Tiket'}
            </button>
          </form>
        </div>
      </main>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}