'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface DetailTiketItem {
  id: string;
  penumpangNama: string;
  penumpangIdentitas: string;
  kursi: {
    nomorKursi: string;
    gerbong: { namaGerbong: string; kelas: string };
  };
}

interface PemesananData {
  id: string;
  kodeBooking: string;
  statusPembayaran: 'PENDING' | 'PAID' | 'CANCELLED';
  totalBayar: number | string;
  expiredAt: string;
  jadwal: {
    waktuBerangkat: string;
    waktuTiba: string;
    kereta: { namaKereta: string; kodeKereta: string };
    rute: {
      stasiunAsal: { namaStasiun: string; kodeStasiun: string };
      stasiunTujuan: { namaStasiun: string; kodeStasiun: string };
    };
  };
  detailTiket: DetailTiketItem[];
}

function formatRupiah(nominal: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(nominal));
}

function PembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode') || '';

  const [booking, setBooking] = useState<PemesananData | null>(null);
  const [metode, setMetode] = useState('QRIS');
  const [sisaDetik, setSisaDetik] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!kode) {
      setLoading(false);
      setErrorMsg('Kode booking tidak ditemukan.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/pemesanan/${encodeURIComponent(kode)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Pemesanan tidak ditemukan.');
      }
      setBooking(json?.data ?? json);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memuat data pembayaran.'
      );
    } finally {
      setLoading(false);
    }
  }, [kode]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!booking || booking.statusPembayaran !== 'PENDING') return;

    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(booking.expiredAt).getTime() - Date.now()) / 1000)
      );
      setSisaDetik(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  const handleAction = async (action: 'PAY' | 'CANCEL') => {
    if (!booking) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/pemesanan/${encodeURIComponent(booking.kodeBooking)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, metodePembayaran: metode }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal memproses transaksi.');
      }

      if (action === 'PAY') {
        router.push(`/booking/${encodeURIComponent(booking.kodeBooking)}`);
      } else {
        await fetchDetail();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Terjadi kesalahan transaksi.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-slate-400">
        Memuat detail tagihan...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-sm text-rose-400">
          {errorMsg || 'Data transaksi tidak ditemukan.'}
        </p>
        <Link
          href="/jadwal"
          className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          Cari Jadwal Kereta
        </Link>
      </div>
    );
  }

  const menit = sisaDetik !== null ? Math.floor(sisaDetik / 60) : 0;
  const detik = sisaDetik !== null ? sisaDetik % 60 : 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kode Booking
            </p>
            <h1 className="text-2xl font-extrabold tracking-wide text-amber-400">
              {booking.kodeBooking}
            </h1>
          </div>
          <span
            className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-bold ${
              booking.statusPembayaran === 'PAID'
                ? 'bg-emerald-500/20 text-emerald-300'
                : booking.statusPembayaran === 'CANCELLED'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {booking.statusPembayaran}
          </span>
        </div>

        {booking.statusPembayaran === 'PENDING' && sisaDetik !== null && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs font-semibold text-amber-300 sm:text-sm">
            Batas Waktu Pembayaran:{' '}
            {String(menit).padStart(2, '0')}:{String(detik).padStart(2, '0')}
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200 sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* Info Perjalanan */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="font-bold text-white">
            {booking.jadwal.kereta.namaKereta} ({booking.jadwal.kereta.kodeKereta})
          </p>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {booking.jadwal.rute.stasiunAsal.namaStasiun} ({booking.jadwal.rute.stasiunAsal.kodeStasiun}) →{' '}
            {booking.jadwal.rute.stasiunTujuan.namaStasiun} ({booking.jadwal.rute.stasiunTujuan.kodeStasiun})
          </p>
          <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
            {booking.detailTiket.map((t, idx) => (
              <div
                key={t.id}
                className="flex flex-col justify-between gap-1 text-xs sm:flex-row sm:items-center"
              >
                <span className="text-slate-200">
                  {idx + 1}. {t.penumpangNama} ({t.penumpangIdentitas})
                </span>
                <span className="font-semibold text-amber-400">
                  {t.kursi.gerbong.namaGerbong} • Kursi {t.kursi.nomorKursi}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metode Pembayaran */}
        {booking.statusPembayaran === 'PENDING' && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pilih Metode Pembayaran
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {['QRIS', 'Virtual Account', 'E-Wallet'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetode(m)}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    metode === m
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Total & Tombol Aksi */}
        <div className="mt-6 border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Tagihan</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {formatRupiah(booking.totalBayar)}
            </span>
          </div>

          {booking.statusPembayaran === 'PENDING' ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('PAY')}
                className="min-h-[46px] flex-1 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {processing ? 'Memproses...' : `Bayar Sekarang (${metode})`}
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('CANCEL')}
                className="min-h-[46px] rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
              >
                Batalkan
              </button>
            </div>
          ) : booking.statusPembayaran === 'PAID' ? (
            <Link
              href={`/booking/${encodeURIComponent(booking.kodeBooking)}`}
              className="mt-5 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-slate-950"
            >
              Lihat E-Tiket / Boarding Pass
            </Link>
          ) : (
            <Link
              href="/jadwal"
              className="mt-5 flex min-h-[46px] w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-white"
            >
              Cari Jadwal Lain
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PembayaranPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">
            Menyiapkan halaman pembayaran...
          </div>
        }
      >
        <PembayaranContent />
      </Suspense>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}