'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DetailTiketItem {
  id: string;
  penumpangNama: string;
  penumpangIdentitas: string;
  statusTiket: 'BOOKED' | 'BOARDED';
  kursi: {
    nomorKursi: string;
    gerbong: { namaGerbong: string; kelas: string };
  };
}

interface BookingDetail {
  id: string;
  kodeBooking: string;
  statusPembayaran: 'PENDING' | 'PAID' | 'CANCELLED';
  totalBayar: number | string;
  jadwal: {
    waktuBerangkat: string;
    waktuTiba: string;
    kereta: { namaKereta: string; kodeKereta: string };
    rute: {
      stasiunAsal: { namaStasiun: string; kodeStasiun: string; kota: string };
      stasiunTujuan: { namaStasiun: string; kodeStasiun: string; kota: string };
    };
  };
  detailTiket: DetailTiketItem[];
}

function formatJamWib(iso: string) {
  return (
    new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }) + ' WIB'
  );
}

function formatTanggalId(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function formatRupiah(nominal: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(nominal));
}

function BookingDetailContent() {
  const params = useParams<{ kodeBooking: string }>();
  const kodeBooking = params?.kodeBooking || '';

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!kodeBooking) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/pemesanan/${encodeURIComponent(kodeBooking)}`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || 'E-Tiket tidak ditemukan.');
        }
        setBooking(json?.data ?? json);
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Gagal memuat e-tiket.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [kodeBooking]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-slate-400">
        Memuat Boarding Pass...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-sm text-rose-400">
          {errorMsg || 'Kode booking tidak ditemukan.'}
        </p>
        <Link
          href="/tiket"
          className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          Cek Kode Lain
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header Boarding Pass */}
        <div className="flex flex-col gap-3 bg-gradient-to-r from-amber-500 to-amber-400 p-5 text-slate-950 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">
              E-Tiket & Boarding Pass
            </p>
            <h1 className="text-2xl font-black tracking-wider sm:text-3xl">
              {booking.kodeBooking}
            </h1>
          </div>
          <span className="inline-flex w-fit rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-extrabold text-amber-400">
            {booking.statusPembayaran}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {/* Info Kereta */}
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white">
              {booking.jadwal.kereta.namaKereta}{' '}
              <span className="text-amber-400">
                ({booking.jadwal.kereta.kodeKereta})
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatTanggalId(booking.jadwal.waktuBerangkat)}
            </p>
          </div>

          {/* Rute */}
          <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white sm:text-xl">
                {formatJamWib(booking.jadwal.waktuBerangkat)}
              </p>
              <p className="truncate text-xs font-bold text-amber-400 sm:text-sm">
                {booking.jadwal.rute.stasiunAsal.namaStasiun} (
                {booking.jadwal.rute.stasiunAsal.kodeStasiun})
              </p>
              <p className="text-[11px] text-slate-400">
                {booking.jadwal.rute.stasiunAsal.kota}
              </p>
            </div>
            <div className="text-slate-500">→</div>
            <div className="min-w-0 text-right">
              <p className="text-base font-extrabold text-white sm:text-xl">
                {formatJamWib(booking.jadwal.waktuTiba)}
              </p>
              <p className="truncate text-xs font-bold text-emerald-400 sm:text-sm">
                {booking.jadwal.rute.stasiunTujuan.namaStasiun} (
                {booking.jadwal.rute.stasiunTujuan.kodeStasiun})
              </p>
              <p className="text-[11px] text-slate-400">
                {booking.jadwal.rute.stasiunTujuan.kota}
              </p>
            </div>
          </div>

          {/* Daftar Penumpang */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Manifest Penumpang
            </p>
            <div className="space-y-2.5">
              {booking.detailTiket.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3.5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {t.penumpangNama}
                    </p>
                    <p className="text-xs text-slate-400">
                      NIK: {t.penumpangIdentitas}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
                      {t.kursi.gerbong.namaGerbong} • {t.kursi.nomorKursi}
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        t.statusTiket === 'BOARDED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {t.statusTiket}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-sm">
            <span className="text-slate-400">Total Pembayaran</span>
            <span className="text-lg font-extrabold text-amber-400">
              {formatRupiah(booking.totalBayar)}
            </span>
          </div>

          {/* Tombol Aksi Responsif */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
            {booking.statusPembayaran === 'PENDING' && (
              <Link
                href={`/pembayaran?kode=${encodeURIComponent(booking.kodeBooking)}`}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-bold text-slate-950"
              >
                Lanjutkan Pembayaran
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] flex-1 rounded-xl bg-amber-500 px-4 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              Cetak E-Tiket
            </button>
            <Link
              href="/dashboard"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm font-bold text-white hover:bg-slate-700"
            >
              Tiket Saya
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookingDetailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">
            Memuat e-tiket...
          </div>
        }
      >
        <BookingDetailContent />
      </Suspense>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500 print:hidden">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}