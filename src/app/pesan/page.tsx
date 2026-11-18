'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface KursiItem {
  id: string;
  nomorKursi: string;
  isBooked?: boolean;
  terisi?: boolean;
}

interface GerbongItem {
  id: string;
  namaGerbong: string;
  nomorGerbong: number;
  kelas: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI';
  kursi: KursiItem[];
}

interface JadwalDetail {
  id: string;
  waktuBerangkat: string;
  waktuTiba: string;
  kereta: {
    namaKereta: string;
    kodeKereta: string;
  };
  rute: {
    stasiunAsal: { namaStasiun: string; kodeStasiun: string };
    stasiunTujuan: { namaStasiun: string; kodeStasiun: string };
    tarif?: Array<{ kelas: string; harga: number }>;
  };
  hargaPerKelas?: Record<string, number>;
}

interface PassengerForm {
  kursiId: string;
  labelKursi: string;
  penumpangNama: string;
  penumpangIdentitas: string;
}

function formatRupiah(nominal: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nominal);
}

function PesanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get('jadwalId') || '';
  const initialKelas = (searchParams.get('kelas') || 'EKSEKUTIF') as
    | 'EKSEKUTIF'
    | 'BISNIS'
    | 'EKONOMI';

  const [jadwal, setJadwal] = useState<JadwalDetail | null>(null);
  const [gerbongList, setGerbongList] = useState<GerbongItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState(initialKelas);
  const [activeGerbongId, setActiveGerbongId] = useState<string>('');
  const [passengers, setPassengers] = useState<PassengerForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadKursi = useCallback(async () => {
    if (!jadwalId) {
      setLoading(false);
      setErrorMsg('Parameter jadwalId tidak ditemukan.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/kursi?jadwalId=${encodeURIComponent(jadwalId)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal memuat data kursi.');
      }

      const payload = json?.data ?? json;
      const gList: GerbongItem[] =
        payload?.gerbong ?? payload?.gerbongList ?? [];
      setJadwal(payload?.jadwal ?? null);
      setGerbongList(gList);

      const firstMatching =
        gList.find((g) => g.kelas === selectedKelas) ?? gList[0];
      if (firstMatching) {
        setSelectedKelas(firstMatching.kelas);
        setActiveGerbongId(firstMatching.id);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memuat layout kursi.'
      );
    } finally {
      setLoading(false);
    }
  }, [jadwalId, selectedKelas]);

  useEffect(() => {
    loadKursi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalId]);

  const gerbongFiltered = useMemo(
    () => gerbongList.filter((g) => g.kelas === selectedKelas),
    [gerbongList, selectedKelas]
  );

  const activeGerbong = useMemo(
    () =>
      gerbongFiltered.find((g) => g.id === activeGerbongId) ??
      gerbongFiltered[0] ??
      null,
    [gerbongFiltered, activeGerbongId]
  );

  const availableClasses = useMemo(() => {
    const set = new Set(gerbongList.map((g) => g.kelas));
    return Array.from(set);
  }, [gerbongList]);

  const hargaSatuan = useMemo(() => {
    if (!jadwal) return 0;
    if (jadwal.hargaPerKelas?.[selectedKelas]) {
      return Number(jadwal.hargaPerKelas[selectedKelas]);
    }
    const found = jadwal.rute?.tarif?.find((t) => t.kelas === selectedKelas);
    return found ? Number(found.harga) : 0;
  }, [jadwal, selectedKelas]);

  const toggleSeat = (kursi: KursiItem, gerbong: GerbongItem) => {
    const booked = Boolean(kursi.isBooked ?? kursi.terisi);
    if (booked) return;

    setErrorMsg(null);
    setPassengers((prev) => {
      const exists = prev.find((p) => p.kursiId === kursi.id);
      if (exists) {
        return prev.filter((p) => p.kursiId !== kursi.id);
      }
      if (prev.length >= 4) {
        setErrorMsg('Maksimal 4 penumpang dalam 1 kali pemesanan.');
        return prev;
      }
      return [
        ...prev,
        {
          kursiId: kursi.id,
          labelKursi: `${gerbong.namaGerbong} • ${kursi.nomorKursi}`,
          penumpangNama: '',
          penumpangIdentitas: '',
        },
      ];
    });
  };

  const updatePassengerField = (
    kursiId: string,
    field: 'penumpangNama' | 'penumpangIdentitas',
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((p) => (p.kursiId === kursiId ? { ...p, [field]: value } : p))
    );
  };

  const handleKelasChange = (kelas: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI') => {
    setSelectedKelas(kelas);
    setPassengers([]);
    const match = gerbongList.find((g) => g.kelas === kelas);
    if (match) setActiveGerbongId(match.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passengers.length === 0) {
      setErrorMsg('Silakan pilih minimal 1 kursi terlebih dahulu.');
      return;
    }

    for (const p of passengers) {
      if (p.penumpangNama.trim().length < 2) {
        setErrorMsg(`Lengkapi nama penumpang untuk kursi ${p.labelKursi}.`);
        return;
      }
      if (p.penumpangIdentitas.trim().length < 8) {
        setErrorMsg(`NIK/No. Identitas minimal 8 karakter untuk kursi ${p.labelKursi}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pemesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jadwalId,
          kelas: selectedKelas,
          penumpang: passengers.map((p) => ({
            kursiId: p.kursiId,
            penumpangNama: p.penumpangNama.trim(),
            penumpangIdentitas: p.penumpangIdentitas.trim(),
          })),
        }),
      });

      const json = await res.json();
      if (res.status === 401) {
        setErrorMsg(
          'Anda belum masuk. Silakan login terlebih dahulu untuk melanjutkan pemesanan.'
        );
        return;
      }
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal membuat pemesanan tiket.');
      }

      const kodeBooking = json?.data?.kodeBooking ?? json?.kodeBooking;
      router.push(`/pembayaran?kode=${encodeURIComponent(kodeBooking)}`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memesan.'
      );
      loadKursi();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-slate-400">
        Memuat layout gerbong dan ketersediaan kursi...
      </div>
    );
  }

  if (!jadwal) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-sm text-rose-400">
          {errorMsg || 'Data jadwal tidak ditemukan.'}
        </p>
        <Link
          href="/jadwal"
          className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          Kembali ke Cari Jadwal
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header Ringkasan Jadwal */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">
                {jadwal.kereta.namaKereta}
              </h1>
              <span className="rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                {jadwal.kereta.kodeKereta}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {jadwal.rute.stasiunAsal.namaStasiun} ({jadwal.rute.stasiunAsal.kodeStasiun}) →{' '}
              {jadwal.rute.stasiunTujuan.namaStasiun} ({jadwal.rute.stasiunTujuan.kodeStasiun})
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 sm:text-right">
            <p className="text-xs text-slate-400">Tarif {selectedKelas}</p>
            <p className="text-lg font-extrabold text-amber-400">
              {formatRupiah(hargaSatuan)}{' '}
              <span className="text-xs font-normal text-slate-400">/ kursi</span>
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMsg}</span>
          {errorMsg.toLowerCase().includes('login') && (
            <Link
              href={`/login?redirect=${encodeURIComponent(`/pesan?jadwalId=${jadwalId}&kelas=${selectedKelas}`)}`}
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-center text-xs font-bold text-slate-950"
            >
              Masuk Sekarang
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Panel Kiri: Pilih Kelas, Gerbong & Kursi */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 lg:col-span-7">
          <h2 className="text-base font-bold text-white sm:text-lg">
            1. Pilih Kelas & Kursi
          </h2>

          {/* Tabs Kelas */}
          <div className="mt-3 flex flex-wrap gap-2">
            {availableClasses.map((kls) => (
              <button
                key={kls}
                type="button"
                onClick={() => handleKelasChange(kls)}
                className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition ${
                  selectedKelas === kls
                    ? 'bg-amber-500 text-slate-950'
                    : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {kls}
              </button>
            ))}
          </div>

          {/* Tabs Gerbong */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {gerbongFiltered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGerbongId(g.id)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  activeGerbong?.id === g.id
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {g.namaGerbong}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded border border-slate-700 bg-slate-950" />
              Tersedia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-amber-500" />
              Dipilih
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-slate-800 opacity-50" />
              Terisi
            </span>
          </div>

          {/* Grid Kursi Responsif (4 kolom + lorong tengah) */}
          {activeGerbong && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-5">
              <div className="mb-3 grid grid-cols-5 text-center text-[11px] font-bold text-slate-500">
                <span>A</span>
                <span>B</span>
                <span>Lorong</span>
                <span>C</span>
                <span>D</span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {activeGerbong.kursi.map((kursi) => {
                  const booked = Boolean(kursi.isBooked ?? kursi.terisi);
                  const selected = passengers.some((p) => p.kursiId === kursi.id);
                  return (
                    <button
                      key={kursi.id}
                      type="button"
                      disabled={booked}
                      onClick={() => toggleSeat(kursi, activeGerbong)}
                      className={`flex min-h-[42px] items-center justify-center rounded-xl border text-xs font-bold transition ${
                        booked
                          ? 'cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-600 line-through'
                          : selected
                            ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-500/60'
                      }`}
                    >
                      {kursi.nomorKursi}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Panel Kanan: Form Data Penumpang & Total */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 lg:col-span-5"
        >
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">
              2. Data Penumpang ({passengers.length}/4)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Isi nama lengkap dan NIK sesuai KTP/Paspor untuk verifikasi boarding.
            </p>

            {passengers.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
                Ketuk kursi yang tersedia di sebelah untuk menambahkan penumpang.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {passengers.map((p, idx) => (
                  <div
                    key={p.kursiId}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3.5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">
                        Penumpang {idx + 1} • {p.labelKursi}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPassengers((prev) =>
                            prev.filter((item) => item.kursiId !== p.kursiId)
                          )
                        }
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Nama Lengkap sesuai KTP"
                        value={p.penumpangNama}
                        onChange={(e) =>
                          updatePassengerField(
                            p.kursiId,
                            'penumpangNama',
                            e.target.value
                          )
                        }
                        className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white placeholder-slate-500 outline-none focus:border-amber-500 sm:text-sm"
                      />
                      <input
                        type="text"
                        required
                        placeholder="NIK / Nomor Identitas (16 digit)"
                        value={p.penumpangIdentitas}
                        onChange={(e) =>
                          updatePassengerField(
                            p.kursiId,
                            'penumpangIdentitas',
                            e.target.value
                          )
                        }
                        className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white placeholder-slate-500 outline-none focus:border-amber-500 sm:text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Total ({passengers.length} tiket)
              </span>
              <span className="text-xl font-extrabold text-amber-400">
                {formatRupiah(hargaSatuan * passengers.length)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || passengers.length === 0}
              className="mt-4 min-h-[46px] w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {submitting ? 'Menyimpan Pesanan...' : 'Lanjut ke Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function PesanPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">
            Menyiapkan halaman pemesanan...
          </div>
        }
      >
        <PesanContent />
      </Suspense>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © 2026 Railink KAI • Projek UAS Pemrograman Web - Kelompok 14
      </footer>
    </div>
  );
}