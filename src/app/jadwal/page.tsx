'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface StasiunItem {
  id: string;
  kodeStasiun: string;
  namaStasiun: string;
  kota: string;
}

interface KelasTersediaItem {
  kelas: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI';
  harga: number;
  sisaKursi: number;
}

interface TarifRawItem {
  kelas: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI';
  harga: number;
  sisaKursi?: number;
}

interface JadwalItem {
  id: string;
  waktuBerangkat: string;
  waktuTiba: string;
  kereta: {
    id: string;
    namaKereta: string;
    kodeKereta: string;
  };
  rute: {
    id: string;
    jarakKm: number;
    stasiunAsal: StasiunItem;
    stasiunTujuan: StasiunItem;
    tarif?: TarifRawItem[];
  };
  kelasTersedia?: KelasTersediaItem[];
  tarif?: TarifRawItem[];
  sisaKursiPerKelas?: Record<string, number>;
}

function formatRupiah(nominal: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nominal);
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
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function hitungDurasi(berangkat: string, tiba: string) {
  const diffMs = Math.max(0, new Date(tiba).getTime() - new Date(berangkat).getTime());
  const totalMenit = Math.floor(diffMs / 60000);
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  return `${jam}j ${menit}m`;
}

function extractKelasList(item: JadwalItem): KelasTersediaItem[] {
  if (Array.isArray(item.kelasTersedia) && item.kelasTersedia.length > 0) {
    return item.kelasTersedia;
  }
  const rawTarif: TarifRawItem[] = Array.isArray(item.tarif)
    ? item.tarif
    : Array.isArray(item.rute?.tarif)
      ? item.rute.tarif
      : [];

  return rawTarif.map((t) => ({
    kelas: t.kelas,
    harga: Number(t.harga),
    sisaKursi:
      typeof t.sisaKursi === 'number'
        ? t.sisaKursi
        : (item.sisaKursiPerKelas?.[t.kelas] ?? 40),
  }));
}

function JadwalContent() {
  const searchParams = useSearchParams();
  const [stasiunList, setStasiunList] = useState<StasiunItem[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [asalId, setAsalId] = useState(searchParams.get('asalId') || '');
  const [tujuanId, setTujuanId] = useState(searchParams.get('tujuanId') || '');
  const [tanggal, setTanggal] = useState(searchParams.get('tanggal') || '');
  const [searchKereta, setSearchKereta] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadStasiun = async () => {
      try {
        const res = await fetch('/api/stasiun', { cache: 'no-store' });
        const json = await res.json();
        setStasiunList(Array.isArray(json) ? json : (json?.data ?? []));
      } catch {
        setStasiunList([]);
      }
    };
    loadStasiun();
  }, []);

  const fetchJadwal = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (asalId) params.set('asalId', asalId);
      if (tujuanId) params.set('tujuanId', tujuanId);
      if (tanggal) params.set('tanggal', tanggal);

      const res = await fetch(
        `/api/jadwal${params.toString() ? `?${params.toString()}` : ''}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal memuat jadwal kereta.');
      }
      setJadwalList(Array.isArray(json) ? json : (json?.data ?? []));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat jadwal.');
    } finally {
      setLoading(false);
    }
  }, [asalId, tujuanId, tanggal]);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  const filteredJadwal = jadwalList.filter((item) => {
    if (!searchKereta.trim()) return true;
    const q = searchKereta.toLowerCase();
    return (
      item.kereta.namaKereta.toLowerCase().includes(q) ||
      item.kereta.kodeKereta.toLowerCase().includes(q)
    );
  });

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJadwal();
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
          Jadwal & Tarif Kereta Api
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Pilih jadwal perjalanan dan kelas layanan yang tersedia.
        </p>
      </div>

      {/* Filter Bar Responsif */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Stasiun Asal
          </label>
          <select
            value={asalId}
            onChange={(e) => setAsalId(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-500 sm:text-sm"
          >
            <option value="">Semua Asal</option>
            {stasiunList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.namaStasiun} ({st.kodeStasiun})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Stasiun Tujuan
          </label>
          <select
            value={tujuanId}
            onChange={(e) => setTujuanId(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-500 sm:text-sm"
          >
            <option value="">Semua Tujuan</option>
            {stasiunList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.namaStasiun} ({st.kodeStasiun})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tanggal
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cari Kereta
          </label>
          <input
            type="text"
            placeholder="Nama / Kode KA..."
            value={searchKereta}
            onChange={(e) => setSearchKereta(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white placeholder-slate-500 outline-none focus:border-amber-500 sm:text-sm"
          />
        </div>

        <button
          type="submit"
          className="min-h-[44px] w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
        >
          Terapkan Filter
        </button>
      </form>

      {/* Hasil Jadwal */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
            />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-300">{errorMsg}</p>
        </div>
      ) : filteredJadwal.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-sm font-medium text-slate-300">
            Tidak ada jadwal yang cocok dengan filter Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setAsalId('');
              setTujuanId('');
              setTanggal('');
              setSearchKereta('');
            }}
            className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJadwal.map((item) => {
            const kelasList = extractKelasList(item);
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        {item.kereta.namaKereta}
                      </h2>
                      <span className="rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                        {item.kereta.kodeKereta}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Jarak Tempuh: {Number(item.rute.jarakKm)} km • Estimasi Durasi:{' '}
                      {hitungDurasi(item.waktuBerangkat, item.waktuTiba)}
                    </p>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:gap-6 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white sm:text-base">
                        {formatJamWib(item.waktuBerangkat)}
                      </p>
                      <p className="truncate text-xs font-semibold text-amber-400">
                        {item.rute.stasiunAsal.namaStasiun} ({item.rute.stasiunAsal.kodeStasiun})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatTanggalId(item.waktuBerangkat)}
                      </p>
                    </div>

                    <div className="text-slate-500">→</div>

                    <div className="min-w-0 text-right">
                      <p className="text-sm font-bold text-white sm:text-base">
                        {formatJamWib(item.waktuTiba)}
                      </p>
                      <p className="truncate text-xs font-semibold text-emerald-400">
                        {item.rute.stasiunTujuan.namaStasiun} ({item.rute.stasiunTujuan.kodeStasiun})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatTanggalId(item.waktuTiba)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {kelasList.map((k) => (
                    <div
                      key={k.kelas}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {k.kelas}
                        </p>
                        <p className="text-base font-extrabold text-amber-400">
                          {formatRupiah(k.harga)}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            k.sisaKursi > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {k.sisaKursi > 0 ? `Sisa ${k.sisaKursi} kursi` : 'Habis'}
                        </p>
                      </div>

                      <Link
                        href={
                          k.sisaKursi > 0
                            ? `/pesan?jadwalId=${item.id}&kelas=${k.kelas}`
                            : '#'
                        }
                        aria-disabled={k.sisaKursi <= 0}
                        className={`flex min-h-[40px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition ${
                          k.sisaKursi > 0
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            : 'pointer-events-none bg-slate-800 text-slate-500'
                        }`}
                      >
                        {k.sisaKursi > 0 ? 'Pilih' : 'Penuh'}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function JadwalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">
            Memuat jadwal kereta...
          </div>
        }
      >
        <JadwalContent />
      </Suspense>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}