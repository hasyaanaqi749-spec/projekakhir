'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

interface BookingSummary {
  id: string;
  kodeBooking: string;
  statusPembayaran: 'PENDING' | 'PAID' | 'CANCELLED';
  totalBayar: number | string;
  createdAt: string;
  jadwal: {
    waktuBerangkat: string;
    kereta: { namaKereta: string; kodeKereta: string };
    rute: {
      stasiunAsal: { namaStasiun: string; kodeStasiun: string };
      stasiunTujuan: { namaStasiun: string; kodeStasiun: string };
    };
  };
  detailTiket: Array<{ id: string; penumpangNama: string }>;
}

function formatRupiah(nominal: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(nominal));
}

function DashboardContent() {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [loading, setLoading] = useState(true);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pemesanan', { cache: 'no-store' });
        if (res.status === 401) {
          setNeedLogin(true);
          return;
        }
        const json = await res.json();
        setBookings(Array.isArray(json) ? json : (json?.data ?? []));
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const filtered = bookings.filter((b) =>
    filterStatus === 'SEMUA' ? true : b.statusPembayaran === filterStatus
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Tiket Saya</h1>
          <p className="text-sm text-slate-400">
            Riwayat pemesanan dan status pembayaran tiket Anda.
          </p>
        </div>
        <Link
          href="/jadwal"
          className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950"
        >
          + Pesan Tiket Baru
        </Link>
      </div>

      {/* Filter Status */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {['SEMUA', 'PAID', 'PENDING', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
              filterStatus === st
                ? 'bg-amber-500 text-slate-950'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
            />
          ))}
        </div>
      ) : needLogin ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
          <p className="text-sm text-slate-300">
            Silakan masuk terlebih dahulu untuk melihat riwayat tiket Anda.
          </p>
          <Link
            href="/login?redirect=/dashboard"
            className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950"
          >
            Masuk ke Akun
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
          <p className="text-sm text-slate-400">
            Belum ada pemesanan tiket pada kategori ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-amber-400">
                    {item.kodeBooking}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      item.statusPembayaran === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.statusPembayaran === 'CANCELLED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.statusPembayaran}
                  </span>
                </div>
                <p className="text-base font-bold text-white">
                  {item.jadwal.kereta.namaKereta} ({item.jadwal.kereta.kodeKereta})
                </p>
                <p className="text-xs text-slate-300">
                  {item.jadwal.rute.stasiunAsal.namaStasiun} →{' '}
                  {item.jadwal.rute.stasiunTujuan.namaStasiun} •{' '}
                  {item.detailTiket.length} Penumpang
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <p className="text-base font-extrabold text-amber-400">
                  {formatRupiah(item.totalBayar)}
                </p>
                {item.statusPembayaran === 'PENDING' ? (
                  <Link
                    href={`/pembayaran?kode=${encodeURIComponent(item.kodeBooking)}`}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                  >
                    Bayar Sekarang
                  </Link>
                ) : (
                  <Link
                    href={`/booking/${encodeURIComponent(item.kodeBooking)}`}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    Lihat E-Tiket
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">
            Memuat riwayat tiket...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}