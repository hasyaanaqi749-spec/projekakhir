'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TiketDetail {
  kodeBooking: string;
  namaKereta: string;
  kodeKereta: string;
  stasiunAsal: string;
  stasiunTujuan: string;
  waktuBerangkat: string;
  waktuTiba: string;
  namaPenumpang: string;
  identitas: string;
  gerbong: string;
  kursi: string;
  kelas: string;
  statusPembayaran: 'PAID' | 'PENDING' | 'CANCELLED';
  statusTiket: 'BOOKED' | 'BOARDED';
  totalBayar: number;
}

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const kodeBooking = String(params?.kodeBooking || 'RLK-88219').toUpperCase();

  const [tiket, setTiket] = useState<TiketDetail>({
    kodeBooking: kodeBooking,
    namaKereta: 'Argo Bromo Anggrek',
    kodeKereta: 'ABA-01',
    stasiunAsal: 'Gambir (GMR)',
    stasiunTujuan: 'Surabaya Pasarturi (SBI)',
    waktuBerangkat: '10 Nov 2026, 08:00 WIB',
    waktuTiba: '10 Nov 2026, 16:15 WIB',
    namaPenumpang: 'Budi Santoso',
    identitas: '3201234567890001',
    gerbong: 'Eksekutif 1',
    kursi: '4A',
    kelas: 'EKSEKUTIF',
    statusPembayaran: 'PAID',
    statusTiket: 'BOOKED',
    totalBayar: 557500,
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition flex items-center gap-1.5"
          >
            ← Kembali ke Beranda
          </Link>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold rounded-xl transition text-white flex items-center gap-2"
          >
            <span>🖨️</span> Cetak E-Tiket
          </button>
        </div>

        {/* Kartu Boarding Pass / E-Tiket Utama */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Header Tiket */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 font-black flex items-center justify-center text-xl shadow-md">
                🚆
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">Railink Boarding Pass</h1>
                <p className="text-xs font-bold opacity-80">PT Kereta Api Indonesia (Persero)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Kode Booking</p>
              <p className="text-xl font-black font-mono tracking-wider">{tiket.kodeBooking}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Tiket */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <div>
                <p className="text-[11px] text-slate-400">Status Pembayaran</p>
                <p className="text-xs font-bold text-emerald-400">✓ LUNAS (PAID)</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Status Boarding</p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    tiket.statusTiket === 'BOARDED'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {tiket.statusTiket === 'BOARDED' ? 'SUDAH CHECK-IN' : 'SIAP BOARDING'}
                </span>
              </div>
            </div>

            {/* Relasi Perjalanan */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-6">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Keberangkatan</p>
                <p className="text-lg font-black text-white mt-1">{tiket.stasiunAsal}</p>
                <p className="text-xs text-amber-400 font-mono mt-0.5">{tiket.waktuBerangkat}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Kedatangan</p>
                <p className="text-lg font-black text-white mt-1">{tiket.stasiunTujuan}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{tiket.waktuTiba}</p>
              </div>
            </div>

            {/* Detail Kereta, Gerbong, Kursi */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Armada</p>
                <p className="text-sm font-bold text-white mt-0.5">{tiket.namaKereta}</p>
                <p className="text-[11px] text-slate-500 font-mono">{tiket.kodeKereta}</p>
              </div>
              <div className="border-x border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Gerbong</p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">{tiket.gerbong}</p>
                <p className="text-[11px] text-slate-500">{tiket.kelas}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Nomor Kursi</p>
                <p className="text-base font-black text-white mt-0.5 font-mono">{tiket.kursi}</p>
                <p className="text-[11px] text-emerald-400">Jendela</p>
              </div>
            </div>

            {/* Identitas Penumpang */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nama Penumpang</p>
                <p className="text-sm font-bold text-white mt-0.5">{tiket.namaPenumpang}</p>
                <p className="text-xs text-slate-500 font-mono">NIK: {tiket.identitas}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Total Tarif</p>
                <p className="text-base font-black text-amber-400 font-mono mt-0.5">
                  {formatRupiah(tiket.totalBayar)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Barcode Simulasi */}
          <div className="bg-slate-950 border-t border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center font-mono text-[9px] text-slate-950 font-black text-center leading-tight">
                [QR CODE RAILINK]
              </div>
              <div>
                <p className="text-xs font-bold text-white">Tunjukkan QR ke Petugas</p>
                <p className="text-[11px] text-slate-400">Scan di pintu keberangkatan stasiun</p>
              </div>
            </div>
            <Link
              href="/petugas/validasi"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Simulasi Boarding Petugas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper Suspense Wajib untuk Next.js 16 Prerender
export default function BookingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">Menyiapkan e-tiket penumpang...</p>
        </div>
      }
    >
      <BookingDetailContent />
    </Suspense>
  );
}