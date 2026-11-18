// src/app/admin/stasiun/page.tsx
// ========================================================================
// SISTEM INFORMASI KERETA API (KELOMPOK 14)
// Halaman Manajemen Master Data Stasiun (Dark Theme + CRUD Supabase)
// ========================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import {
  MapPin,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const stasiunSchema = z.object({
  kodeStasiun: z
    .string()
    .trim()
    .min(2, { message: 'Kode stasiun minimal 2 karakter.' })
    .max(10, { message: 'Kode stasiun maksimal 10 karakter.' })
    .toUpperCase(),
  namaStasiun: z
    .string()
    .trim()
    .min(3, { message: 'Nama stasiun minimal 3 karakter.' })
    .max(100, { message: 'Nama stasiun maksimal 100 karakter.' }),
  kota: z
    .string()
    .trim()
    .min(3, { message: 'Nama kota minimal 3 karakter.' })
    .max(100, { message: 'Nama kota maksimal 100 karakter.' }),
});

type StasiunFormData = z.infer<typeof stasiunSchema>;

interface StasiunItem {
  id: string;
  kodeStasiun: string;
  namaStasiun: string;
  kota: string;
}

export default function MasterStasiunPage() {
  const [stations, setStations] = useState<StasiunItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modal Tambah/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StasiunFormData>({
    kodeStasiun: '',
    namaStasiun: '',
    kota: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string>('');

  // Modal Hapus
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/stasiun', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFetchError(json.error || 'Gagal memuat data stasiun.');
      } else {
        setStations(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      setFetchError('Terjadi gangguan jaringan saat mengambil data stasiun.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ kodeStasiun: '', namaStasiun: '', kota: '' });
    setFormErrors({});
    setApiError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: StasiunItem) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      kodeStasiun: item.kodeStasiun,
      namaStasiun: item.namaStasiun,
      kota: item.kota,
    });
    setFormErrors({});
    setApiError('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setApiError('');

    const result = stasiunSchema.safeParse(formData);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/stasiun', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing && currentId ? { id: currentId, ...result.data } : result.data
        ),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setApiError(json.error || 'Gagal menyimpan data stasiun.');
        return;
      }

      await fetchStations();
      setIsModalOpen(false);
      showToast(
        isEditing
          ? `Stasiun ${result.data.namaStasiun} berhasil diperbarui.`
          : `Stasiun ${result.data.namaStasiun} berhasil ditambahkan.`
      );
    } catch {
      setApiError('Gagal terhubung ke server saat menyimpan stasiun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/stasiun?id=${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setDeleteError(json.error || 'Gagal menghapus stasiun.');
        return;
      }

      await fetchStations();
      showToast(`Stasiun ${deleteName} berhasil dihapus.`);
      setDeleteId(null);
    } catch {
      setDeleteError('Terjadi kesalahan jaringan saat menghapus stasiun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStations = stations.filter(
    (s) =>
      s.kodeStasiun.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.namaStasiun.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kota.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStations.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStations = filteredStations.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFIKASI */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER PAGE */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-7 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full mb-2">
            MASTER DATA
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Manajemen Master Stasiun</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola master data stasiun kereta api, kode stasiun resmi, dan lokasi kota di seluruh rute operasional.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Stasiun Baru</span>
        </button>
      </div>

      {/* ERROR BANNER */}
      {fetchError && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* SEARCH BAR & CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan kode, nama stasiun, kota..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            Total <strong className="text-white">{filteredStations.length}</strong> Stasiun Terdaftar
          </span>
        </div>

        {/* TAMPILAN MOBILE CARDS */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-slate-950 border border-slate-800 rounded-xl animate-pulse space-y-2">
                <div className="h-4 bg-slate-800 rounded w-16" />
                <div className="h-4 bg-slate-800 rounded w-40" />
              </div>
            ))
          ) : paginatedStations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Tidak ada stasiun yang cocok dengan pencarian Anda.
            </div>
          ) : (
            paginatedStations.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="inline-block font-mono font-black text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md mb-1">
                    {item.kodeStasiun}
                  </span>
                  <p className="text-sm font-bold text-white truncate">{item.namaStasiun}</p>
                  <p className="text-xs text-slate-400 truncate">{item.kota}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                    title="Edit Stasiun"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(item.id);
                      setDeleteName(item.namaStasiun);
                      setDeleteError('');
                    }}
                    className="p-2 bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-lg transition"
                    title="Hapus Stasiun"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TAMPILAN DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-5">No</th>
                <th className="py-3.5 px-5">Kode Stasiun</th>
                <th className="py-3.5 px-5">Nama Stasiun</th>
                <th className="py-3.5 px-5">Kota Lokasi</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm text-slate-300">
              {isLoading ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-800 rounded w-6" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-800 rounded w-36" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-800 rounded w-28" /></td>
                    <td className="py-4 px-5 text-right"><div className="h-6 bg-slate-800 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedStations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                    Tidak ada stasiun yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedStations.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                      {(safePage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {item.kodeStasiun}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-white">
                      {item.namaStasiun}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {item.kota}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition cursor-pointer"
                          title="Edit Stasiun"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(item.id);
                            setDeleteName(item.namaStasiun);
                            setDeleteError('');
                          }}
                          className="p-2 bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-lg transition cursor-pointer"
                          title="Hapus Stasiun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-400">
            Menampilkan Halaman <strong className="font-bold text-white">{safePage}</strong> dari{' '}
            <strong className="font-bold text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
              className="p-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-950 bg-amber-500 rounded-xl">
              {safePage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
              className="p-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT STASIUN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">
                {isEditing ? 'Edit Data Stasiun' : 'Tambah Stasiun Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {apiError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-semibold">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Kode Stasiun (2–10 Huruf) *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Contoh: GMR, YK, SGU"
                  value={formData.kodeStasiun}
                  onChange={(e) =>
                    setFormData({ ...formData, kodeStasiun: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold uppercase focus:outline-none focus:border-amber-500 transition"
                />
                {formErrors.kodeStasiun && (
                  <p className="text-[11px] text-red-400 font-semibold mt-1">
                    {formErrors.kodeStasiun}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Nama Stasiun Kereta Api *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Yogyakarta"
                  value={formData.namaStasiun}
                  onChange={(e) => setFormData({ ...formData, namaStasiun: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
                {formErrors.namaStasiun && (
                  <p className="text-[11px] text-red-400 font-semibold mt-1">
                    {formErrors.namaStasiun}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Kota Lokasi *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Yogyakarta"
                  value={formData.kota}
                  onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
                {formErrors.kota && (
                  <p className="text-[11px] text-red-400 font-semibold mt-1">
                    {formErrors.kota}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Stasiun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Hapus Stasiun?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus stasiun <strong className="text-white">{deleteName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
                onClick={() => setDeleteId(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
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