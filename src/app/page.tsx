'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const date = new Date(iso);
  return (
    date.toLocaleTimeString('id-ID', {
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

function HomeContent() {
  const router = useRouter();
  const [stasiunList, setStasiunList] = useState<StasiunItem[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [asalId, setAsalId] = useState('');
  const [tujuanId, setTujuanId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [loadingStasiun, setLoadingStasiun] = useState(true);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const todayWib = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Jakarta',
    });
    setTanggal(todayWib);
  }, []);

  const fetchStasiun = useCallback(async () => {
    setLoadingStasiun(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/stasiun', {
        cache: 'no-store',
        signal: controller.signal,
      });
      const json = await res.json();
      const rows = Array.isArray(json) ? json : (json?.data ?? []);
      setStasiunList(rows);
    } catch {
      setStasiunList([]);
    } finally {
      clearTimeout(timer);
      setLoadingStasiun(false);
    }
  }, []);

  const fetchJadwal = useCallback(async (selectedTanggal?: string) => {
    setLoadingJadwal(true);
    setErrorMsg(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const params = new URLSearchParams();
      if (selectedTanggal) params.set('tanggal', selectedTanggal);
      const url = `/api/jadwal${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const json = await res.json();
      let rows: JadwalItem[] = Array.isArray(json) ? json : (json?.data ?? []);

      if (rows.length === 0 && selectedTanggal) {
        const fallbackRes = await fetch('/api/jadwal', { cache: 'no-store' });
        const fallbackJson = await fallbackRes.json();
        rows = Array.isArray(fallbackJson) ? fallbackJson : (fallbackJson?.data ?? []);
      }

      setJadwalList(rows.slice(0, 6));
    } catch {
      setErrorMsg('Gagal memuat jadwal perjalanan. Silakan coba muat ulang.');
    } finally {
      clearTimeout(timer);
      setLoadingJadwal(false);
    }
  }, []);

  useEffect(() => {
    fetchStasiun();
  }, [fetchStasiun]);

  useEffect(() => {
    if (tanggal) {
      fetchJadwal(tanggal);
    }
  }, [tanggal, fetchJadwal]);

  const handleCariTiket = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (asalId) params.set('asalId', asalId);
    if (tujuanId) params.set('tujuanId', tujuanId);
    if (tanggal) params.set('tanggal', tanggal);
    router.push(`/jadwal${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      {/* Hero Section */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-2xl sm:rounded-3xl sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Perjalanan Kereta Api Lebih Mudah & Nyaman
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Temukan jadwal keberangkatan resmi, pilih nomor kursi sesuai keinginan, dan kelola e-tiket Anda dengan cepat.
          </p>
        </div>

        {/* Form Pencarian Responsif */}
        <form
          onSubmit={handleCariTiket}
          className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Stasiun Asal
            </label>
            <select
              value={asalId}
              onChange={(e) => setAsalId(e.target.value)}
              disabled={loadingStasiun}
              className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-base text-white outline-none transition focus:border-amber-500 sm:text-sm"
            >
              <option value="">
                {loadingStasiun ? 'Memuat stasiun...' : 'Semua Stasiun Asal'}
              </option>
              {stasiunList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.namaStasiun} ({st.kodeStasiun}) - {st.kota}
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
              disabled={loadingStasiun}
              className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-base text-white outline-none transition focus:border-amber-500 sm:text-sm"
            >
              <option value="">
                {loadingStasiun ? 'Memuat stasiun...' : 'Semua Stasiun Tujuan'}
              </option>
              {stasiunList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.namaStasiun} ({st.kodeStasiun}) - {st.kota}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tanggal Berangkat
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-base text-white outline-none transition focus:border-amber-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="min-h-[44px] w-full rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Cari Tiket Kereta
          </button>
        </form>
      </section>

      {/* Akses Cepat Antar Portal */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/jadwal"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-amber-500/50 hover:bg-slate-900"
        >
          <p className="text-sm font-bold text-white">Cari Jadwal</p>
          <p className="mt-1 text-xs text-slate-400">Pilih kereta & kursi</p>
        </Link>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-amber-500/50 hover:bg-slate-900"
        >
          <p className="text-sm font-bold text-white">Tiket Saya</p>
          <p className="mt-1 text-xs text-slate-400">Riwayat & bayar tiket</p>
        </Link>
        <Link
          href="/tiket"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-amber-500/50 hover:bg-slate-900"
        >
          <p className="text-sm font-bold text-white">Cek E-Tiket</p>
          <p className="mt-1 text-xs text-slate-400">Cari kode booking</p>
        </Link>
        <Link
          href="/petugas"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
        >
          <p className="text-sm font-bold text-emerald-400">Gate Petugas</p>
          <p className="mt-1 text-xs text-slate-400">Validasi boarding</p>
        </Link>
      </section>

      {/* Daftar Jadwal Populer */}
      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Jadwal Keberangkatan Tersedia
            </h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Pilih kelas layanan untuk langsung memilih nomor kursi.
            </p>
          </div>
          <Link
            href="/jadwal"
            className="text-sm font-semibold text-amber-400 transition hover:text-amber-300"
          >
            Lihat Semua Jadwal →
          </Link>
        </div>

        {loadingJadwal ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
              />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
            <p className="text-sm text-rose-300">{errorMsg}</p>
            <button
              type="button"
              onClick={() => fetchJadwal(tanggal)}
              className="mt-3 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
            >
              Muat Ulang
            </button>
          </div>
        ) : jadwalList.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <p className="text-sm text-slate-300">
              Belum ada jadwal keberangkatan yang tersedia.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jadwalList.map((item) => {
              const kelasList = extractKelasList(item);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700 sm:p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white sm:text-lg">
                          {item.kereta.namaKereta}
                        </h3>
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
                          {item.kereta.kodeKereta}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Jarak Tempuh: {Number(item.rute.jarakKm)} km • Estimasi Durasi:{' '}
                        {hitungDurasi(item.waktuBerangkat, item.waktuTiba)}
                      </p>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:gap-5 sm:px-5">
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

                      <div className="text-center text-slate-500">→</div>

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

                  {/* Pilihan Kelas */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {kelasList.map((k) => (
                      <div
                        key={k.kelas}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5"
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
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">
            Memuat beranda Railink...
          </div>
        }
      >
        <HomeContent />
      </Suspense>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}