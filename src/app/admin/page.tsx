'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface TarifData {
  id: string;
  ruteId: string;
  kelas: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI';
  harga: number;
  updatedAt: string;
  stasiunAsal: string;
  stasiunTujuan: string;
  jarakKm: number;
}

interface RuteOption {
  id: string;
  label: string;
  jarakKm: number;
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function KelolaTarifPage() {
  const [daftarTarif, setDaftarTarif] = useState<TarifData[]>([]);
  const [ruteList, setRuteList] = useState<RuteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarif, setEditingTarif] = useState<TarifData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ruteId: '',
    kelas: 'EKSEKUTIF' as 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI',
    harga: 250000,
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchTarif = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/tarif', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal mengambil data tarif.');
      }
      setDaftarTarif(json.tarif ?? []);
      setRuteList(json.ruteList ?? []);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal terhubung ke database.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTarif();
  }, [fetchTarif]);

  const rataRata = useMemo(() => {
    const avg = (kls: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI') => {
      const rows = daftarTarif.filter((t) => t.kelas === kls);
      if (rows.length === 0) return 0;
      return Math.round(
        rows.reduce((sum, item) => sum + item.harga, 0) / rows.length
      );
    };
    return {
      EKSEKUTIF: avg('EKSEKUTIF'),
      BISNIS: avg('BISNIS'),
      EKONOMI: avg('EKONOMI'),
    };
  }, [daftarTarif]);

  const filteredTarif = daftarTarif.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.stasiunAsal.toLowerCase().includes(q) ||
      item.stasiunTujuan.toLowerCase().includes(q) ||
      item.kelas.toLowerCase().includes(q);
    const matchKelas = filterKelas === 'SEMUA' || item.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  const handleOpenAddModal = () => {
    setEditingTarif(null);
    setErrorMsg(null);
    setFormData({
      ruteId: ruteList[0]?.id || '',
      kelas: 'EKSEKUTIF',
      harga: 250000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TarifData) => {
    setEditingTarif(item);
    setErrorMsg(null);
    setFormData({
      ruteId: item.ruteId,
      kelas: item.kelas,
      harga: item.harga,
    });
    setIsModalOpen(true);
  };

  const handleSaveTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!editingTarif && !formData.ruteId) {
      setErrorMsg('Pilih rute perjalanan terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/tarif', {
        method: editingTarif ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingTarif
            ? { id: editingTarif.id, harga: formData.harga }
            : {
                ruteId: formData.ruteId,
                kelas: formData.kelas,
                harga: formData.harga,
              }
        ),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal menyimpan tarif.');
      }

      setIsModalOpen(false);
      showToast(
        editingTarif
          ? 'Tarif berhasil diperbarui di Supabase.'
          : 'Tarif baru berhasil disimpan ke Supabase.'
      );
      await fetchTarif();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan tarif.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTarif = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/tarif?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal menghapus tarif.');
      }
      setConfirmDeleteId(null);
      showToast('Tarif berhasil dihapus dari database.');
      await fetchTarif();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menghapus tarif.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-xl sm:text-sm">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Kelola Tarif Kereta Api
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Atur harga tiket per rute &amp; kelas layanan yang langsung sinkron ke Portal Penumpang.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          disabled={ruteList.length === 0}
          className="flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-50"
        >
          <span>+</span>
          <span>Tambah / Atur Tarif</span>
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Statistik Tarif Riil */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Rata-rata Eksekutif
          </p>
          <p className="mt-1 text-xl font-black text-amber-400">
            {rataRata.EKSEKUTIF > 0 ? formatRupiah(rataRata.EKSEKUTIF) : '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Rata-rata Bisnis
          </p>
          <p className="mt-1 text-xl font-black text-blue-400">
            {rataRata.BISNIS > 0 ? formatRupiah(rataRata.BISNIS) : '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Rata-rata Ekonomi
          </p>
          <p className="mt-1 text-xl font-black text-emerald-400">
            {rataRata.EKONOMI > 0 ? formatRupiah(rataRata.EKONOMI) : '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Total Tarif Rute
          </p>
          <p className="mt-1 text-xl font-black text-white">
            {daftarTarif.length} Tarif
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex-row md:items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari stasiun asal atau tujuan..."
          className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none md:w-80 md:text-sm"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['SEMUA', 'EKSEKUTIF', 'BISNIS', 'EKONOMI'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilterKelas(k)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterKelas === k
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Tampilan Mobile (Cards) */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-400">
            Memuat data tarif dari Supabase...
          </div>
        ) : filteredTarif.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-400">
            Tidak ada data tarif yang cocok.
          </div>
        ) : (
          filteredTarif.map((t) => (
            <div
              key={t.id}
              className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">{t.stasiunAsal}</p>
                  <p className="text-[11px] text-slate-400">→ {t.stasiunTujuan}</p>
                </div>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                  {t.kelas}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="font-mono text-base font-black text-white">
                  {formatRupiah(t.harga)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(t)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-amber-400"
                  >
                    Ubah
                  </button>
                  {confirmDeleteId === t.id ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTarif(t.id)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Konfirmasi
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
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
                <th className="px-5 py-4">Relasi Rute</th>
                <th className="px-5 py-4">Jarak</th>
                <th className="px-5 py-4">Kelas</th>
                <th className="px-5 py-4">Harga Tiket</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Memuat data tarif dari Supabase...
                  </td>
                </tr>
              ) : filteredTarif.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ditemukan data tarif yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTarif.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">{t.stasiunAsal}</div>
                      <div className="text-xs text-slate-400">→ {t.stasiunTujuan}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {t.jarakKm} km
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-bold ${
                          t.kelas === 'EKSEKUTIF'
                            ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                            : t.kelas === 'BISNIS'
                              ? 'border-blue-500/30 bg-blue-500/20 text-blue-300'
                              : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {t.kelas}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-base font-black text-white">
                      {formatRupiah(t.harga)}
                    </td>
                    <td className="space-x-2 px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(t)}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-slate-700"
                      >
                        Ubah Harga
                      </button>
                      {confirmDeleteId === t.id ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteTarif(t.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Yakin Hapus?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-900/60"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Tarif */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-black text-white">
              {editingTarif ? 'Ubah Harga Tarif' : 'Tambah / Update Tarif Rute'}
            </h2>

            <form onSubmit={handleSaveTarif} className="space-y-4">
              {!editingTarif ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                      Rute Perjalanan
                    </label>
                    <select
                      value={formData.ruteId}
                      onChange={(e) =>
                        setFormData({ ...formData, ruteId: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      {ruteList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                      Kelas Layanan
                    </label>
                    <select
                      value={formData.kelas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kelas: e.target.value as 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI',
                        })
                      }
                      className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="EKSEKUTIF">EKSEKUTIF</option>
                      <option value="BISNIS">BISNIS</option>
                      <option value="EKONOMI">EKONOMI</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
                  <p className="font-bold text-white">
                    {editingTarif.stasiunAsal} → {editingTarif.stasiunTujuan}
                  </p>
                  <p className="mt-1 text-amber-400">Kelas: {editingTarif.kelas}</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  Harga Tiket (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={5000}
                  value={formData.harga}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      harga: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 font-mono text-base text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[42px] flex-1 rounded-xl bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[42px] flex-1 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}