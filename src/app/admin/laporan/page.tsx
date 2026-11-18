'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface PenumpangItem {
  nama: string;
  identitas: string;
  kursi: string;
  statusTiket: string;
}

interface BookingReportItem {
  id: string;
  kodeBooking: string;
  pemesanNama: string;
  pemesanEmail: string;
  penumpangList?: PenumpangItem[];
  namaKereta: string;
  rute: string;
  totalBayar: number;
  statusPembayaran: 'PAID' | 'PENDING' | 'CANCELLED';
  createdAt: string;
}

interface ReportStats {
  totalPesanan: number;
  pendingCount: number;
  paidCount: number;
  totalPendapatan: number;
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

export default function LaporanPemesananPage() {
  const [dataPemesanan, setDataPemesanan] = useState<BookingReportItem[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalPesanan: 0,
    pendingCount: 0,
    paidCount: 0,
    totalPendapatan: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal memuat data laporan.');
      }
      setDataPemesanan(json.bookings ?? []);
      setStats({
        totalPesanan: json.stats?.totalPesanan ?? 0,
        pendingCount: json.stats?.pendingCount ?? 0,
        paidCount: json.stats?.paidCount ?? 0,
        totalPendapatan: json.stats?.totalPendapatan ?? 0,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal terhubung ke database.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  const filteredData = dataPemesanan.filter((item) => {
    const matchStatus =
      filterStatus === 'SEMUA' || item.statusPembayaran === filterStatus;
    const q = searchQuery.toLowerCase();
    const passengerNames = (item.penumpangList || [])
      .map((p) => p.nama.toLowerCase())
      .join(' ');
    const matchSearch =
      item.kodeBooking.toLowerCase().includes(q) ||
      item.pemesanNama.toLowerCase().includes(q) ||
      item.namaKereta.toLowerCase().includes(q) ||
      passengerNames.includes(q);
    return matchStatus && matchSearch;
  });

  const totalPenumpangLunas = dataPemesanan
    .filter((d) => d.statusPembayaran === 'PAID')
    .reduce((sum, item) => sum + (item.penumpangList?.length || 1), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Laporan Pemesanan &amp; Keuangan
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Rekapitulasi penjualan tiket kereta api langsung dari Supabase (Kelompok 14).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={fetchLaporan}
            disabled={loading}
            className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            {loading ? 'Memuat...' : 'Refresh Data'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] rounded-xl bg-amber-500 px-4 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Total Pendapatan Lunas
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-emerald-400">
            {formatRupiah(stats.totalPendapatan)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Dari {stats.paidCount} transaksi berstatus PAID
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Kursi Terjual (PAID)
          </p>
          <p className="mt-1 text-2xl font-black text-amber-400">
            {totalPenumpangLunas} Kursi
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Tercatat di detail tiket Supabase
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Total Transaksi
          </p>
          <p className="mt-1 text-2xl font-black text-blue-400">
            {stats.totalPesanan} Pesanan
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Semua status pemesanan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Menunggu Pembayaran
          </p>
          <p className="mt-1 text-2xl font-black text-purple-400">
            {stats.pendingCount} Transaksi
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Status PENDING aktif
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex-row md:items-center print:hidden">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kode booking, nama penumpang, kereta..."
          className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none md:w-96 md:text-sm"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['SEMUA', 'PAID', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tampilan Mobile (Cards) */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-400">
            Memuat laporan transaksi dari Supabase...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-400">
            Tidak ada catatan transaksi yang sesuai.
          </div>
        ) : (
          filteredData.map((order) => (
            <div
              key={order.id}
              className="space-y-2.5 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono font-bold text-amber-400">
                  {order.kodeBooking}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                    order.statusPembayaran === 'PAID'
                      ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                      : order.statusPembayaran === 'PENDING'
                        ? 'border-amber-800 bg-amber-950 text-amber-400'
                        : 'border-red-800 bg-red-950 text-red-400'
                  }`}
                >
                  {order.statusPembayaran}
                </span>
              </div>

              <div>
                {order.penumpangList && order.penumpangList.length > 0 ? (
                  order.penumpangList.map((p, idx) => (
                    <p key={idx} className="font-bold text-white">
                      {p.nama} ({p.kursi})
                    </p>
                  ))
                ) : (
                  <p className="font-bold text-white">{order.pemesanNama}</p>
                )}
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {order.namaKereta} • {order.rute}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-[11px] text-slate-500">
                  {formatTanggal(order.createdAt)}
                </span>
                <span className="font-mono text-sm font-black text-white">
                  {formatRupiah(order.totalBayar)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tampilan Desktop (Table) */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950 text-xs font-semibold uppercase text-slate-400">
              <tr>
                <th className="px-5 py-4">Kode Booking</th>
                <th className="px-5 py-4">Penumpang</th>
                <th className="px-5 py-4">Kereta &amp; Rute</th>
                <th className="px-5 py-4">Total Bayar</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Memuat laporan transaksi dari Supabase...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada catatan transaksi pemesanan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredData.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-mono font-bold text-amber-400">
                        {order.kodeBooking}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {formatTanggal(order.createdAt)} WIB
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {order.penumpangList && order.penumpangList.length > 0 ? (
                        <div className="space-y-1">
                          {order.penumpangList.map((p, idx) => (
                            <div key={idx}>
                              <span className="font-bold text-white">{p.nama}</span>
                              <span className="ml-2 rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">
                                {p.kursi}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="font-bold text-white">{order.pemesanNama}</div>
                      )}
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Akun: {order.pemesanEmail}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-slate-200">
                        {order.namaKereta}
                      </div>
                      <div className="text-[11px] text-slate-400">{order.rute}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {formatRupiah(order.totalBayar)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-bold ${
                          order.statusPembayaran === 'PAID'
                            ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                            : order.statusPembayaran === 'PENDING'
                              ? 'border-amber-800 bg-amber-950 text-amber-400'
                              : 'border-red-800 bg-red-950 text-red-400'
                        }`}
                      >
                        {order.statusPembayaran === 'PAID'
                          ? 'Lunas'
                          : order.statusPembayaran === 'PENDING'
                            ? 'Menunggu'
                            : 'Batal'}
                      </span>
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