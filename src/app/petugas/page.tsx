'use client';

import React, { useState, useEffect } from 'react';

interface PassengerTicket {
  id: string;
  penumpangNama?: string;
  nama?: string;
  penumpangIdentitas?: string;
  identitas?: string;
  nik?: string;
  kodeBooking?: string;
  nomorKursi?: string;
  kursi?: string;
  gerbong?: string;
  namaKereta?: string;
  rute?: string;
  statusTiket?: 'BOOKED' | 'BOARDED' | string;
}

export default function PortalPetugasPage() {
  const [tickets, setTickets] = useState<PassengerTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scanCode, setScanCode] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);

  const fetchTickets = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/petugas', { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Gagal memuat tiket.');
      }

      const list: PassengerTicket[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      setTickets(list);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyambung ke server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCheckInTicket = async (ticket: PassengerTicket) => {
    if (!ticket.id) return;

    setProcessingId(ticket.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/petugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticket.id }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Gagal check-in.');
      }

      setSuccessMsg(
        `✓ Penumpang ${ticket.penumpangNama || ticket.nama || 'ini'} berhasil Check-in (BOARDED).`
      );

      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, statusTiket: 'BOARDED' } : t))
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memproses check-in.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleValidateBookingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanCode.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCode(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/petugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kodeBooking: code }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || `Kode booking ${code} tidak valid.`);
      }

      setSuccessMsg(json.message || `Kode booking ${code} valid & berhasil check-in!`);
      setScanCode('');
      await fetchTickets();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memvalidasi tiket.'
      );
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Abaikan
    }
    window.location.href = '/login';
  };

  const totalCount = tickets.length;
  const boardedCount = tickets.filter((t) => t.statusTiket === 'BOARDED').length;
  const unboardedCount = totalCount - boardedCount;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <span className="text-sm font-semibold">{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-200"
            >
              Tutup
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
            <span className="text-sm font-semibold">{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="shrink-0 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Portal Petugas */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:p-8">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                ROLE: PETUGAS STASIUN
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                Gate Boarding Aktif (Supabase)
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              Portal Validasi Boarding Tiket
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Pemeriksaan &amp; Validasi Tiket Penumpang Berbayar (PAID) secara langsung dengan Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchTickets}
              disabled={loading}
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              {loading ? '↻ Memuat...' : '↻ Refresh Data'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[42px] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
            >
              Keluar Akun
            </button>
          </div>
        </div>

        {/* Section 1: Scan / Input Kode Booking */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-400">
            INPUT / SCAN KODE BOOKING TIKET
          </label>
          <form onSubmit={handleValidateBookingCode} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value.toUpperCase())}
              placeholder="CONTOH: RLK-I9RFW"
              className="min-h-[46px] flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-base uppercase tracking-wider text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
            />
            <button
              type="submit"
              disabled={isValidatingCode || !scanCode.trim()}
              className="min-h-[46px] shrink-0 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isValidatingCode ? 'Memvalidasi...' : 'Validasi Tiket'}
            </button>
          </form>
        </div>

        {/* Section 2: Daftar Penumpang Siap Boarding */}
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 md:text-xl">
                Daftar Penumpang Siap Boarding (Tiket Lunas)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Semua tiket berstatus PAID di Supabase otomatis tampil di sini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                Total: {totalCount} Penumpang
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Belum: {unboardedCount}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                Boarded: {boardedCount}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Memuat data tiket dari Supabase...
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Belum ada tiket berstatus PAID.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t, idx) => {
                const passengerName =
                  t.penumpangNama || t.nama || `Penumpang #${idx + 1}`;
                const bookingCode = t.kodeBooking || '-';
                const seatNumber = t.nomorKursi || t.kursi || '1A';
                const carriage = t.gerbong || 'Gerbong 1';
                const isBoarded = t.statusTiket === 'BOARDED';
                const isUpdating = processingId === t.id;

                return (
                  <div
                    key={t.id || idx}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:bg-slate-50/50 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {passengerName}
                        </span>
                        {(t.penumpangIdentitas || t.nik || t.identitas) && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                            NIK: {t.penumpangIdentitas || t.nik || t.identitas}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          Kode:{' '}
                          <strong className="font-mono text-slate-800">
                            {bookingCode}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Kursi:{' '}
                          <strong className="font-semibold text-slate-800">
                            {seatNumber}
                          </strong>{' '}
                          ({carriage})
                        </span>
                        {t.namaKereta && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{t.namaKereta}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isBoarded ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-700 shadow-sm">
                          <span>✓</span>
                          <span>SUDAH BOARDING (CHECKED-IN)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckInTicket(t)}
                          disabled={isUpdating}
                          className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95 disabled:bg-slate-300 sm:w-auto"
                        >
                          {isUpdating ? (
                            <span>Memproses...</span>
                          ) : (
                            <span>BELUM CHECK-IN (Check-in Sekarang →)</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}