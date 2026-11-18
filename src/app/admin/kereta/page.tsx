// src/app/admin/kereta/page.tsx
// ========================================================================
// SISTEM INFORMASI KERETA API (KELOMPOK 14)
// Halaman Manajemen Master Kereta, Rangkaian Gerbong & Generator Kursi
// (Dark Theme + Terhubung Penuh ke Supabase)
// ========================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Train,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  X,
  Eye,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface GerbongItem {
  id: string;
  nomorGerbong: number;
  namaGerbong: string;
  kelas: 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI';
  totalKursi: number;
}

interface KeretaItem {
  id: string;
  kodeKereta: string;
  namaKereta: string;
  gerbong: GerbongItem[];
}

export default function MasterKeretaPage() {
  const [trains, setTrains] = useState<KeretaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);

  // Modal Tambah Kereta Baru
  const [isAddTrainOpen, setIsAddTrainOpen] = useState<boolean>(false);
  const [trainForm, setTrainForm] = useState({ kodeKereta: '', namaKereta: '' });
  const [trainError, setTrainError] = useState<string>('');

  // Modal Tambah Gerbong Baru
  const [isAddGerbongOpen, setIsAddGerbongOpen] = useState<boolean>(false);
  const [targetTrainId, setTargetTrainId] = useState<string | null>(null);
  const [gerbongForm, setGerbongForm] = useState({
    namaGerbong: 'Eksekutif 1',
    nomorGerbong: 1,
    kelas: 'EKSEKUTIF' as 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI',
    totalBaris: 10,
  });
  const [gerbongError, setGerbongError] = useState<string>('');

  // Modal Konfirmasi Hapus Gerbong
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchTrains = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/kereta', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFetchError(json.error || 'Gagal memuat data armada kereta.');
      } else {
        const rows: KeretaItem[] = Array.isArray(json.data) ? json.data : [];
        setTrains(rows);
        setSelectedTrainId((prev) => prev || rows[0]?.id || null);
      }
    } catch {
      setFetchError('Terjadi gangguan koneksi saat mengambil data kereta.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  const selectedTrain = trains.find((t) => t.id === selectedTrainId) || null;

  const handleOpenAddGerbong = (train: KeretaItem) => {
    setTargetTrainId(train.id);
    const maxNomor = train.gerbong.reduce((max, g) => Math.max(max, g.nomorGerbong), 0);
    const nextNomor = maxNomor + 1;
    setGerbongForm({
      namaGerbong: `Eksekutif ${nextNomor}`,
      nomorGerbong: nextNomor,
      kelas: 'EKSEKUTIF',
      totalBaris: 10,
    });
    setGerbongError('');
    setIsAddGerbongOpen(true);
  };

  const handleSubmitTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/kereta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_TRAIN',
          kodeKereta: trainForm.kodeKereta.trim().toUpperCase(),
          namaKereta: trainForm.namaKereta.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setTrainError(json.error || 'Gagal menambahkan kereta baru.');
        return;
      }

      await fetchTrains();
      if (json.data?.id) setSelectedTrainId(json.data.id);
      setIsAddTrainOpen(false);
      setTrainForm({ kodeKereta: '', namaKereta: '' });
      showToast(`Kereta ${json.data?.namaKereta || ''} berhasil ditambahkan.`);
    } catch {
      setTrainError('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGerbong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTrainId) return;

    setGerbongError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/kereta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_GERBONG',
          keretaId: targetTrainId,
          namaGerbong: gerbongForm.namaGerbong.trim(),
          nomorGerbong: Number(gerbongForm.nomorGerbong),
          kelas: gerbongForm.kelas,
          totalBaris: Number(gerbongForm.totalBaris),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setGerbongError(json.error || 'Gagal menambahkan unit gerbong.');
        return;
      }

      await fetchTrains();
      setSelectedTrainId(targetTrainId);
      setIsAddGerbongOpen(false);
      const totalKursi = gerbongForm.totalBaris * 4;
      showToast(
        `Berhasil menambahkan ${gerbongForm.namaGerbong} (${totalKursi} kursi 1A–${gerbongForm.totalBaris}D otomatis dibuat).`
      );
    } catch {
      setGerbongError('Terjadi kesalahan jaringan saat menyimpan gerbong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteGerbong = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    setDeleteError('');
    try {
      const res = await fetch(
        `/api/admin/kereta?type=gerbong&id=${encodeURIComponent(deleteTarget.id)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.error || 'Gagal menghapus gerbong.');
        return;
      }
      await fetchTrains();
      showToast(`Unit ${deleteTarget.label} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch {
      setDeleteError('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrains = trains.filter(
    (t) =>
      t.namaKereta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kodeKereta.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFIKASI */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER PAGE */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-7 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full mb-2">
            MASTER KERETA
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Train className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Master Kereta &amp; Rangkaian Gerbong</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola armada kereta api, susunan unit gerbong, dan generator kursi otomatis (1A–10D).
          </p>
        </div>

        <button
          onClick={() => {
            setTrainError('');
            setIsAddTrainOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kereta Baru</span>
        </button>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* GRID KONTEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: DAFTAR KERETA */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode / nama kereta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-5 rounded-xl bg-slate-950 border border-slate-800 animate-pulse space-y-2"
                >
                  <div className="h-4 bg-slate-800 rounded w-40" />
                  <div className="h-3 bg-slate-800 rounded w-56" />
                </div>
              ))
            ) : filteredTrains.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                Tidak ada armada kereta yang cocok dengan pencarian Anda.
              </div>
            ) : (
              filteredTrains.map((train) => {
                const totalKapasitas = train.gerbong.reduce((acc, curr) => acc + curr.totalKursi, 0);
                const isSelected = selectedTrain?.id === train.id;

                return (
                  <div
                    key={train.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500/5 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {train.kodeKereta}
                          </span>
                          <h3 className="text-base font-black text-white">{train.namaKereta}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {train.gerbong.length} Unit Gerbong • Total Kapasitas {totalKapasitas} Kursi
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTrainId(train.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Gerbong</span>
                        </button>

                        <button
                          onClick={() => handleOpenAddGerbong(train)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Gerbong</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KOLOM KANAN: DETAIL RANGKAIAN GERBONG */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white">
                {selectedTrain ? `Susunan: ${selectedTrain.namaKereta}` : 'Detail Rangkaian Gerbong'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedTrain
                  ? `Kode: ${selectedTrain.kodeKereta}`
                  : 'Pilih salah satu kereta di sebelah kiri.'}
              </p>
            </div>
            {selectedTrain && (
              <button
                onClick={() => handleOpenAddGerbong(selectedTrain)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            )}
          </div>

          {!selectedTrain ? (
            <div className="text-center py-14 text-slate-500 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-xs">Klik tombol &quot;Lihat Gerbong&quot; pada salah satu kereta.</p>
            </div>
          ) : selectedTrain.gerbong.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-xs">Belum ada gerbong terdaftar untuk kereta ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTrain.gerbong.map((gb) => (
                <div
                  key={gb.id}
                  className="p-3.5 sm:p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      #{gb.nomorGerbong}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {gb.namaGerbong}
                      </p>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          gb.kelas === 'EKSEKUTIF'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : gb.kelas === 'BISNIS'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {gb.kelas}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-white block">
                        {gb.totalKursi} Kursi
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Layout 2-2
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setDeleteTarget({ id: gb.id, label: gb.namaGerbong });
                        setDeleteError('');
                      }}
                      className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-lg transition cursor-pointer"
                      title="Hapus Gerbong"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH KERETA BARU */}
      {isAddTrainOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Tambah Armada Kereta</h3>
              <button
                onClick={() => setIsAddTrainOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {trainError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-semibold">
                {trainError}
              </div>
            )}

            <form onSubmit={handleSubmitTrain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Kode Kereta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KA-102"
                  value={trainForm.kodeKereta}
                  onChange={(e) =>
                    setTrainForm({ ...trainForm, kodeKereta: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Nama Kereta Api *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Argo Lawu"
                  value={trainForm.namaKereta}
                  onChange={(e) => setTrainForm({ ...trainForm, namaKereta: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTrainOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Kereta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH UNIT GERBONG & GENERATE KURSI */}
      {isAddGerbongOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">Tambah Unit Gerbong</h3>
                <p className="text-xs text-slate-400">Auto-generate denah kursi 1A–10D.</p>
              </div>
              <button
                onClick={() => setIsAddGerbongOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {gerbongError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-semibold">
                {gerbongError}
              </div>
            )}

            <form onSubmit={handleSubmitGerbong} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Nama Gerbong *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Eksekutif 3"
                  value={gerbongForm.namaGerbong}
                  onChange={(e) =>
                    setGerbongForm({ ...gerbongForm, namaGerbong: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                    Nomor Urut
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={gerbongForm.nomorGerbong}
                    onChange={(e) =>
                      setGerbongForm({ ...gerbongForm, nomorGerbong: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                    Kelas Layanan
                  </label>
                  <select
                    value={gerbongForm.kelas}
                    onChange={(e) =>
                      setGerbongForm({
                        ...gerbongForm,
                        kelas: e.target.value as 'EKSEKUTIF' | 'BISNIS' | 'EKONOMI',
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="EKSEKUTIF">EKSEKUTIF</option>
                    <option value="BISNIS">BISNIS</option>
                    <option value="EKONOMI">EKONOMI</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Generator Denah Kursi (Layout 2-2)
                  </span>
                  <span>{gerbongForm.totalBaris * 4} Kursi</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400">Baris:</label>
                  <input
                    type="range"
                    min={5}
                    max={16}
                    value={gerbongForm.totalBaris}
                    onChange={(e) =>
                      setGerbongForm({ ...gerbongForm, totalBaris: Number(e.target.value) })
                    }
                    className="flex-1 cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs font-mono font-black text-white">
                    {gerbongForm.totalBaris} Baris
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Otomatis membuat kursi 1A, 1B (Lorong) 1C, 1D s/d {gerbongForm.totalBaris}D di Supabase.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGerbongOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan &amp; Generate Kursi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS GERBONG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Hapus Unit Gerbong?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Hapus <strong className="text-white">{deleteTarget.label}</strong> beserta seluruh kursinya?
              </p>
            </div>
            {deleteError && (
              <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-semibold">
                {deleteError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteGerbong}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}