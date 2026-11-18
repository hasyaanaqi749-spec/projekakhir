'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  MapPin,
  Train,
  DollarSign,
  Ticket,
} from 'lucide-react';

interface PenumpangTiketItem {
  nama: string;
  identitas: string;
  kursi: string;
  statusTiket: string;
}

interface BookingItem {
  id: string;
  kodeBooking: string;
  pemesanNama: string;
  pemesanEmail: string;
  penumpangList?: PenumpangTiketItem[];
  namaKereta: string;
  rute: string;
  totalBayar: number;
  statusPembayaran: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
}

interface AdminStats {
  totalPesanan: number;
  totalStasiun: number;
  keretaAktif: number;
  totalPendapatan: number;
  pendingCount: number;
  paidCount: number;
  stasiunSample: string;
  keretaSample: string;
}

export default function AdminOverviewPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalPesanan: 0,
    totalStasiun: 0,
    keretaAktif: 0,
    totalPendapatan: 0,
    pendingCount: 0,
    paidCount: 0,
    stasiunSample: 'Memuat data stasiun...',
    keretaSample: 'Memuat data kereta...',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusTab, setStatusTab] = useState<'SEMUA' | 'PENDING' | 'PAID' | 'CANCELLED'>('SEMUA');
  const [alertSuccess, setAlertSuccess] = useState<string>('');
  const [alertError, setAlertError] = useState<string>('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    setAlertError('');
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Gagal mengambil data dari server admin.');
      }
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
        setStats({
          totalPesanan: data.stats?.totalPesanan ?? 0,
          pendingCount: data.stats?.pendingCount ?? 0,
          paidCount: data.stats?.paidCount ?? 0,
          totalPendapatan: data.stats?.totalPendapatan ?? 0,
          totalStasiun: data.stats?.totalStasiun ?? 0,
          keretaAktif: data.stats?.keretaAktif ?? 0,
          stasiunSample: data.stats?.stasiunSample ?? '-',
          keretaSample: data.stats?.keretaSample ?? '-',
        });
      }
    } catch (err) {
      setAlertError(
        err instanceof Error ? err.message : 'Gagal mengambil data admin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStatusToPaid = async (kodeBooking: string) => {
    setAlertError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kodeBooking, statusPembayaran: 'PAID' }),
      });

      if (res.ok) {
        setAlertSuccess(
          `Tiket ${kodeBooking} berhasil diubah ke PAID. Data di Portal Petugas otomatis sinkron.`
        );
        setTimeout(() => setAlertSuccess(''), 4000);
        fetchAdminData();
      } else {
        setAlertError('Gagal mengubah status pembayaran.');
      }
    } catch {
      setAlertError('Terjadi kendala jaringan saat mengubah status.');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredBookings = bookings.filter((item) => {
    const q = searchFilter.toLowerCase();
    const passengerNames = (item.penumpangList || [])
      .map((p) => p.nama.toLowerCase())
      .join(' ');

    const matchesSearch =
      item.kodeBooking.toLowerCase().includes(q) ||
      item.pemesanNama.toLowerCase().includes(q) ||
      item.pemesanEmail.toLowerCase().includes(q) ||
      item.namaKereta.toLowerCase().includes(q) ||
      passengerNames.includes(q);

    if (!matchesSearch) return false;
    if (statusTab === 'SEMUA') return true;
    return item.statusPembayaran === statusTab;
  });

  return (
    <div className="space-y-6">
      {/* NOTIFIKASI SUKSES */}
      {alertSuccess && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{alertSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertSuccess('')}
            className="shrink-0 cursor-pointer text-xs font-black text-emerald-700"
          >
            Tutup
          </button>
        </div>
      )}

      {/* NOTIFIKASI ERROR */}
      {alertError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{alertError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertError('')}
            className="shrink-0 cursor-pointer text-xs font-black text-rose-700"
          >
            Tutup
          </button>
        </div>
      )}

      {/* HEADER OVERVIEW */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
              SISTEM INFORMASI KAI
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
              ● Database Supabase Aktif
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Dashboard Utama Administrator
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ringkasan metrik operasional kereta, stasiun, rute, dan rekonsiliasi pembayaran tiket.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminData}
          disabled={isLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-200 sm:w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrik</span>
        </button>
      </div>

      {/* 4 CARD STATUS RINGKASAN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1 */}
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pemesanan
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Ticket className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">
              {stats.totalPesanan}
            </span>
            <span className="text-xs font-semibold text-slate-400">Tiket Terdaftar</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {stats.paidCount} Lunas • {stats.pendingCount} Menunggu Bayar
          </p>
        </div>

        {/* CARD 2 */}
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Stasiun
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition-transform group-hover:scale-110">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">
              {stats.totalStasiun}
            </span>
            <span className="text-xs font-semibold text-slate-400">Stasiun Aktif</span>
          </div>
          <p className="mt-2 truncate text-[11px] text-slate-400">{stats.stasiunSample}</p>
        </div>

        {/* CARD 3 */}
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kereta Aktif
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <Train className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">
              {stats.keretaAktif}
            </span>
            <span className="text-xs font-semibold text-slate-400">Rangkaian KA</span>
          </div>
          <p className="mt-2 truncate text-[11px] text-slate-400">{stats.keretaSample}</p>
        </div>

        {/* CARD 4 */}
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pendapatan
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <span className="block text-2xl font-black tracking-tight text-blue-600 sm:text-3xl">
            {formatRupiah(stats.totalPendapatan)}
          </span>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Dari {stats.paidCount} Transaksi Berstatus PAID</span>
          </p>
        </div>
      </div>

      {/* FILTER & DAFTAR PEMESANAN */}
      <div className="space-y-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Daftar Riwayat Transaksi Pemesanan
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan nama penumpang, akun pemesan, kursi, dan status pembayaran.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode, nama penumpang..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="min-h-[40px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:w-64 sm:text-xs"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {(['SEMUA', 'PENDING', 'PAID'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusTab(tab)}
                  className={`flex-1 rounded-lg px-3 py-1.5 transition sm:flex-initial ${
                    statusTab === tab
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAMPILAN MOBILE (KARTU RAPI DI HP) */}
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Memuat data transaksi dari Supabase...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada transaksi yang cocok dengan filter.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const penumpangText =
                b.penumpangList && b.penumpangList.length > 0
                  ? b.penumpangList.map((p) => `${p.nama} (${p.kursi})`).join(', ')
                  : b.pemesanNama;

              return (
                <div
                  key={b.id}
                  className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-black text-blue-600">
                      {b.kodeBooking}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        b.statusPembayaran === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.statusPembayaran === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.statusPembayaran === 'PAID' ? 'PAID (LUNAS)' : b.statusPembayaran}
                    </span>
                  </div>

                  <div>
                    <p className="font-extrabold text-slate-900">{penumpangText}</p>
                    <p className="text-[11px] text-slate-500">
                      Akun: {b.pemesanNama} ({b.pemesanEmail})
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold">{b.namaKereta}</span> • {b.rute}
                    </div>
                    <span className="font-black text-slate-900">
                      {formatRupiah(b.totalBayar)}
                    </span>
                  </div>

                  {b.statusPembayaran === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatusToPaid(b.kodeBooking)}
                      className="mt-1 w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white"
                    >
                      Ubah ke PAID
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* TAMPILAN DESKTOP (TABEL) */}
        <div className="hidden overflow-x-auto pt-2 md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Kode Booking</th>
                <th className="px-4 py-3">Penumpang &amp; Akun</th>
                <th className="px-4 py-3">Kereta &amp; Rute</th>
                <th className="px-4 py-3">Total Bayar</th>
                <th className="px-4 py-3">Status Bayar</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat data transaksi dari Supabase...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-mono font-black text-blue-600">
                      {b.kodeBooking}
                    </td>
                    <td className="px-4 py-3.5">
                      {b.penumpangList && b.penumpangList.length > 0 ? (
                        <div className="space-y-0.5">
                          {b.penumpangList.map((p, idx) => (
                            <p key={idx} className="font-extrabold text-slate-900">
                              {p.nama}{' '}
                              <span className="font-normal text-slate-500">
                                ({p.kursi})
                              </span>
                            </p>
                          ))}
                          <p className="text-[11px] text-slate-400">
                            Akun: {b.pemesanNama} ({b.pemesanEmail})
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="font-extrabold text-slate-900">{b.pemesanNama}</p>
                          <p className="text-[11px] text-slate-400">{b.pemesanEmail}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{b.namaKereta}</p>
                      <p className="text-[11px] text-slate-400">{b.rute}</p>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">
                      {formatRupiah(b.totalBayar)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          b.statusPembayaran === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.statusPembayaran === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.statusPembayaran === 'PAID' ? 'PAID (LUNAS)' : b.statusPembayaran}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {b.statusPembayaran === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatusToPaid(b.kodeBooking)}
                          className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          Ubah ke PAID
                        </button>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}