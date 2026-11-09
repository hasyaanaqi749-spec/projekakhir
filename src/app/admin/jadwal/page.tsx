'use client';

import React, { useState, useEffect } from 'react';

interface StasiunItem {
  id: string;
  kodeStasiun: string;
  namaStasiun: string;
  kota: string;
}

interface KeretaItem {
  id: string;
  namaKereta: string;
  kodeKereta: string;
}

interface JadwalItem {
  id: string;
  namaKereta: string;
  kodeKereta: string;
  stasiunAsal: string;
  stasiunTujuan: string;
  waktuBerangkat: string;
  waktuTiba: string;
  tarifEksekutif: number;
  tarifBisnis: number;
  tarifEkonomi: number;
}

export default function MasterJadwalPage() {
  const daftarStasiun: StasiunItem[] = [
    { id: 'ST-01', kodeStasiun: 'GMR', namaStasiun: 'Gambir', kota: 'Jakarta Pusat' },
    { id: 'ST-02', kodeStasiun: 'PSE', namaStasiun: 'Pasar Senen', kota: 'Jakarta Pusat' },
    { id: 'ST-03', kodeStasiun: 'BD', namaStasiun: 'Bandung', kota: 'Bandung' },
    { id: 'ST-04', kodeStasiun: 'YK', namaStasiun: 'Yogyakarta', kota: 'Yogyakarta' },
    { id: 'ST-05', kodeStasiun: 'SLO', namaStasiun: 'Solo Balapan', kota: 'Surakarta' },
    { id: 'ST-06', kodeStasiun: 'SMT', namaStasiun: 'Semarang Tawang', kota: 'Semarang' },
    { id: 'ST-07', kodeStasiun: 'SBI', namaStasiun: 'Surabaya Pasarturi', kota: 'Surabaya' },
    { id: 'ST-08', kodeStasiun: 'ML', namaStasiun: 'Malang', kota: 'Malang' },
  ];

  const daftarKereta: KeretaItem[] = [
    { id: 'KA-01', namaKereta: 'Argo Bromo Anggrek', kodeKereta: 'ABA-01' },
    { id: 'KA-02', namaKereta: 'Taksaka Malam', kodeKereta: 'TKS-02' },
    { id: 'KA-03', namaKereta: 'Argo Parahyangan', kodeKereta: 'APH-03' },
    { id: 'KA-04', namaKereta: 'Matarmaja', kodeKereta: 'MTM-05' },
    { id: 'KA-05', namaKereta: 'Kertajaya', kodeKereta: 'KTJ-09' },
  ];

  const [daftarJadwal, setDaftarJadwal] = useState<JadwalItem[]>([
    {
      id: 'JDW-001',
      namaKereta: 'Argo Bromo Anggrek',
      kodeKereta: 'ABA-01',
      stasiunAsal: 'Gambir (GMR)',
      stasiunTujuan: 'Surabaya Pasarturi (SBI)',
      waktuBerangkat: '2026-11-10T08:00',
      waktuTiba: '2026-11-10T16:15',
      tarifEksekutif: 550000,
      tarifBisnis: 380000,
      tarifEkonomi: 0,
    },
    {
      id: 'JDW-002',
      namaKereta: 'Taksaka Malam',
      kodeKereta: 'TKS-02',
      stasiunAsal: 'Gambir (GMR)',
      stasiunTujuan: 'Yogyakarta (YK)',
      waktuBerangkat: '2026-11-09T21:00',
      waktuTiba: '2026-11-10T03:30',
      tarifEksekutif: 420000,
      tarifBisnis: 0,
      tarifEkonomi: 0,
    },
    {
      id: 'JDW-003',
      namaKereta: 'Matarmaja',
      kodeKereta: 'MTM-05',
      stasiunAsal: 'Pasar Senen (PSE)',
      stasiunTujuan: 'Malang (ML)',
      waktuBerangkat: '2026-11-08T10:30',
      waktuTiba: '2026-11-08T23:45',
      tarifEksekutif: 0,
      tarifBisnis: 0,
      tarifEkonomi: 185000,
    },
  ]);

  // State waktu aman untuk menghindari error prerender static Next.js 16
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  const [searchKereta, setSearchKereta] = useState('');
  const [filterStasiunAsal, setFilterStasiunAsal] = useState('SEMUA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [selectedKeretaId, setSelectedKeretaId] = useState('');
  const [stasiunAsalId, setStasiunAsalId] = useState('');
  const [stasiunTujuanId, setStasiunTujuanId] = useState('');
  const [waktuBerangkat, setWaktuBerangkat] = useState('');
  const [waktuTiba, setWaktuTiba] = useState('');
  const [tarifEksekutif, setTarifEksekutif] = useState(450000);
  const [tarifBisnis, setTarifBisnis] = useState(300000);
  const [tarifEkonomi, setTarifEkonomi] = useState(180000);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const formatRupiah = (val: number) => {
    if (!val || val === 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getJadwalStatus = (berangkatStr: string, tibaStr: string) => {
    if (!currentTime) {
      return {
        label: 'Akan Datang',
        color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      };
    }

    const berangkatTime = new Date(berangkatStr).getTime();
    const tibaTime = new Date(tibaStr).getTime();

    if (currentTime < berangkatTime) {
      return {
        label: 'Akan Datang',
        color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      };
    } else if (currentTime >= berangkatTime && currentTime <= tibaTime) {
      return {
        label: 'Berjalan',
        color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse',
      };
    } else {
      return {
        label: 'Selesai',
        color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      };
    }
  };

  const filteredJadwal = daftarJadwal.filter((item) => {
    const matchKereta =
      item.namaKereta.toLowerCase().includes(searchKereta.toLowerCase()) ||
      item.kodeKereta.toLowerCase().includes(searchKereta.toLowerCase());
    const matchAsal =
      filterStasiunAsal === 'SEMUA' || item.stasiunAsal.includes(filterStasiunAsal);
    return matchKereta && matchAsal;
  });

  const handleSubmitJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (stasiunAsalId === stasiunTujuanId) {
      setFormError('Stasiun asal dan stasiun tujuan tidak boleh sama!');
      return;
    }

    const berangkat = new Date(waktuBerangkat).getTime();
    const tiba = new Date(waktuTiba).getTime();
    if (tiba <= berangkat) {
      setFormError('Waktu estimasi tiba harus lebih akhir daripada waktu keberangkatan!');
      return;
    }

    const kereta = daftarKereta.find((k) => k.id === selectedKeretaId);
    const asal = daftarStasiun.find((s) => s.id === stasiunAsalId);
    const tujuan = daftarStasiun.find((s) => s.id === stasiunTujuanId);

    if (!kereta || !asal || !tujuan) {
      setFormError('Mohon pilih kereta dan stasiun yang valid.');
      return;
    }

    const newJadwal: JadwalItem = {
      id: `JDW-00${daftarJadwal.length + 1}`,
      namaKereta: kereta.namaKereta,
      kodeKereta: kereta.kodeKereta,
      stasiunAsal: `${asal.namaStasiun} (${asal.kodeStasiun})`,
      stasiunTujuan: `${tujuan.namaStasiun} (${tujuan.kodeStasiun})`,
      waktuBerangkat,
      waktuTiba,
      tarifEksekutif: Number(tarifEksekutif) || 0,
      tarifBisnis: Number(tarifBisnis) || 0,
      tarifEkonomi: Number(tarifEkonomi) || 0,
    };

    setDaftarJadwal([newJadwal, ...daftarJadwal]);
    setIsModalOpen(false);
    showToast(`Jadwal baru ${kereta.namaKereta} berhasil dibuat.`);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🗓️</span> Master Rute & Jadwal Keberangkatan
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola jadwal operasional kereta api, relasi stasiun, dan tarif kelas tiket perjalanan.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0"
        >
          <span>+</span> Buat Jadwal Baru
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={searchKereta}
            onChange={(e) => setSearchKereta(e.target.value)}
            placeholder="Cari nama kereta atau kode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Stasiun Asal:</span>
          <select
            value={filterStasiunAsal}
            onChange={(e) => setFilterStasiunAsal(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="SEMUA">Semua Stasiun Asal</option>
            {daftarStasiun.map((st) => (
              <option key={st.id} value={st.kodeStasiun}>
                {st.namaStasiun} ({st.kodeStasiun})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Kereta Api</th>
                <th className="px-5 py-4">Relasi Rute</th>
                <th className="px-5 py-4">Waktu Berangkat / Tiba</th>
                <th className="px-5 py-4">Tarif per Kelas</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredJadwal.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada jadwal aktif yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredJadwal.map((j) => {
                  const status = getJadwalStatus(j.waktuBerangkat, j.waktuTiba);
                  return (
                    <tr key={j.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{j.namaKereta}</div>
                        <div className="text-xs text-amber-400/90 font-mono">{j.kodeKereta}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-200">{j.stasiunAsal}</div>
                        <div className="text-[11px] text-slate-500">↓ Menuju</div>
                        <div className="text-xs text-slate-200">{j.stasiunTujuan}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-emerald-400 font-mono">
                          🛫 {j.waktuBerangkat.replace('T', ' ')} WIB
                        </div>
                        <div className="text-xs text-amber-300 font-mono mt-0.5">
                          🛬 {j.waktuTiba.replace('T', ' ')} WIB
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono">
                        {j.tarifEksekutif > 0 && (
                          <div>
                            <span className="text-amber-400 font-bold">Eks:</span>{' '}
                            {formatRupiah(j.tarifEksekutif)}
                          </div>
                        )}
                        {j.tarifBisnis > 0 && (
                          <div>
                            <span className="text-blue-400 font-bold">Bis:</span>{' '}
                            {formatRupiah(j.tarifBisnis)}
                          </div>
                        )}
                        {j.tarifEkonomi > 0 && (
                          <div>
                            <span className="text-emerald-400 font-bold">Eko:</span>{' '}
                            {formatRupiah(j.tarifEkonomi)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus jadwal untuk ${j.namaKereta}?`)) {
                              setDaftarJadwal(daftarJadwal.filter((item) => item.id !== j.id));
                              showToast(`Jadwal ${j.namaKereta} dihapus.`);
                            }
                          }}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-bold rounded-lg border border-red-800/40 transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <span>➕ Buat Jadwal Keberangkatan Baru</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitJadwal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Pilih Kereta</label>
                <select
                  required
                  value={selectedKeretaId}
                  onChange={(e) => setSelectedKeretaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Armada Kereta --</option>
                  {daftarKereta.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.namaKereta} ({k.kodeKereta})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stasiun Asal</label>
                  <select
                    required
                    value={stasiunAsalId}
                    onChange={(e) => setStasiunAsalId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Asal --</option>
                    {daftarStasiun.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaStasiun} ({s.kodeStasiun})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stasiun Tujuan</label>
                  <select
                    required
                    value={stasiunTujuanId}
                    onChange={(e) => setStasiunTujuanId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Tujuan --</option>
                    {daftarStasiun.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaStasiun} ({s.kodeStasiun})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Waktu Berangkat
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={waktuBerangkat}
                    onChange={(e) => setWaktuBerangkat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Waktu Tiba</label>
                  <input
                    type="datetime-local"
                    required
                    value={waktuTiba}
                    onChange={(e) => setWaktuTiba(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs font-bold text-slate-300 uppercase mb-2">
                  Pengaturan Tarif per Kelas (Rupiah)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-amber-400 font-semibold mb-1">Eksekutif</label>
                    <input
                      type="number"
                      step={5000}
                      value={tarifEksekutif}
                      onChange={(e) => setTarifEksekutif(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-400 font-semibold mb-1">Bisnis</label>
                    <input
                      type="number"
                      step={5000}
                      value={tarifBisnis}
                      onChange={(e) => setTarifBisnis(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-emerald-400 font-semibold mb-1">Ekonomi</label>
                    <input
                      type="number"
                      step={5000}
                      value={tarifEkonomi}
                      onChange={(e) => setTarifEkonomi(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20"
                >
                  Simpan & Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}