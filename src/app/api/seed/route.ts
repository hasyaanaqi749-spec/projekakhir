import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { KelasKereta } from '@prisma/client';

export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Akun Demo Default (Batch createMany, skipDuplicates)
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.createMany({
      data: [
        {
          nama: 'Administrator Railink',
          email: 'admin@kai.id',
          passwordHash,
          role: 'ADMIN',
          phone: '081200000001',
        },
        {
          nama: 'Petugas Boarding Gambir',
          email: 'petugas@kai.id',
          passwordHash,
          role: 'PETUGAS',
          phone: '081200000002',
        },
        {
          nama: 'Budi Santoso',
          email: 'budi@gmail.com',
          passwordHash,
          role: 'PENUMPANG',
          phone: '081234567890',
        },
      ],
      skipDuplicates: true,
    });

    // 2. Data Stasiun RIIL PT KAI (10 Stasiun Utama Pulau Jawa)
    const stasiunReal = [
      { kodeStasiun: 'GMR', namaStasiun: 'Gambir', kota: 'Jakarta Pusat' },
      { kodeStasiun: 'PSE', namaStasiun: 'Pasar Senen', kota: 'Jakarta Pusat' },
      { kodeStasiun: 'BD', namaStasiun: 'Bandung', kota: 'Bandung' },
      { kodeStasiun: 'CN', namaStasiun: 'Cirebon', kota: 'Cirebon' },
      { kodeStasiun: 'SMT', namaStasiun: 'Semarang Tawang Bank Jateng', kota: 'Semarang' },
      { kodeStasiun: 'YK', namaStasiun: 'Yogyakarta', kota: 'Yogyakarta' },
      { kodeStasiun: 'SLO', namaStasiun: 'Solo Balapan', kota: 'Surakarta' },
      { kodeStasiun: 'SGU', namaStasiun: 'Surabaya Gubeng', kota: 'Surabaya' },
      { kodeStasiun: 'SBI', namaStasiun: 'Surabaya Pasarturi', kota: 'Surabaya' },
      { kodeStasiun: 'ML', namaStasiun: 'Malang', kota: 'Malang' },
    ];

    await prisma.stasiun.createMany({
      data: stasiunReal,
      skipDuplicates: true,
    });

    const allStasiun = await prisma.stasiun.findMany();
    const stasiunMap: Record<string, string> = {};
    for (const s of allStasiun) {
      stasiunMap[s.kodeStasiun] = s.id;
    }

    // 3. Data Kereta Api RIIL PT KAI (GAPEKA Resmi)
    const keretaReal: {
      kodeKereta: string;
      namaKereta: string;
      gerbongs: { nama: string; nomor: number; kelas: KelasKereta; baris: number }[];
    }[] = [
      {
        kodeKereta: 'KA-2',
        namaKereta: 'Argo Bromo Anggrek',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Eksekutif 2', nomor: 2, kelas: 'EKSEKUTIF', baris: 10 },
        ],
      },
      {
        kodeKereta: 'KA-70',
        namaKereta: 'Taksaka',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Eksekutif 2', nomor: 2, kelas: 'EKSEKUTIF', baris: 10 },
        ],
      },
      {
        kodeKereta: 'KA-44',
        namaKereta: 'Argo Parahyangan',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Ekonomi Premium 1', nomor: 2, kelas: 'EKONOMI', baris: 12 },
        ],
      },
      {
        kodeKereta: 'KA-8',
        namaKereta: 'Argo Lawu',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Eksekutif 2', nomor: 2, kelas: 'EKSEKUTIF', baris: 10 },
        ],
      },
      {
        kodeKereta: 'KA-56',
        namaKereta: 'Gajayana',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Eksekutif 2', nomor: 2, kelas: 'EKSEKUTIF', baris: 10 },
        ],
      },
      {
        kodeKereta: 'KA-234',
        namaKereta: 'Matarmaja',
        gerbongs: [
          { nama: 'Ekonomi 1', nomor: 1, kelas: 'EKONOMI', baris: 12 },
          { nama: 'Ekonomi 2', nomor: 2, kelas: 'EKONOMI', baris: 12 },
        ],
      },
      {
        kodeKereta: 'KA-220',
        namaKereta: 'Kertajaya',
        gerbongs: [
          { nama: 'Ekonomi 1', nomor: 1, kelas: 'EKONOMI', baris: 12 },
          { nama: 'Ekonomi 2', nomor: 2, kelas: 'EKONOMI', baris: 12 },
        ],
      },
      {
        kodeKereta: 'KA-14',
        namaKereta: 'Argo Muria',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Eksekutif 2', nomor: 2, kelas: 'EKSEKUTIF', baris: 10 },
        ],
      },
      {
        kodeKereta: 'KA-92',
        namaKereta: 'Lodaya',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Ekonomi 1', nomor: 2, kelas: 'EKONOMI', baris: 12 },
        ],
      },
      {
        kodeKereta: 'KA-6',
        namaKereta: 'Argo Wilis',
        gerbongs: [
          { nama: 'Eksekutif 1', nomor: 1, kelas: 'EKSEKUTIF', baris: 10 },
          { nama: 'Bisnis 1', nomor: 2, kelas: 'BISNIS', baris: 10 },
        ],
      },
    ];

    await prisma.kereta.createMany({
      data: keretaReal.map((k) => ({
        kodeKereta: k.kodeKereta,
        namaKereta: k.namaKereta,
      })),
      skipDuplicates: true,
    });

    const allKereta = await prisma.kereta.findMany();
    const keretaMap: Record<string, string> = {};
    for (const k of allKereta) {
      keretaMap[k.kodeKereta] = k.id;
    }

    // 4. Batch Insert Gerbong
    const gerbongPayload: {
      keretaId: string;
      namaGerbong: string;
      nomorGerbong: number;
      kelas: KelasKereta;
    }[] = [];

    for (const k of keretaReal) {
      const kId = keretaMap[k.kodeKereta];
      if (!kId) continue;
      for (const g of k.gerbongs) {
        gerbongPayload.push({
          keretaId: kId,
          namaGerbong: g.nama,
          nomorGerbong: g.nomor,
          kelas: g.kelas,
        });
      }
    }

    await prisma.gerbong.createMany({
      data: gerbongPayload,
      skipDuplicates: true,
    });

    // 5. Batch Insert Kursi sekaligus dalam 1 query
    const allGerbongs = await prisma.gerbong.findMany({
      include: {
        kereta: { select: { kodeKereta: true } },
        _count: { select: { kursi: true } },
      },
    });

    const kursiPayload: { gerbongId: string; nomorKursi: string }[] = [];
    const kolomKursi = ['A', 'B', 'C', 'D'];

    for (const dbGerbong of allGerbongs) {
      if (dbGerbong._count.kursi > 0) continue; // Sudah punya kursi
      const specKereta = keretaReal.find((k) => k.kodeKereta === dbGerbong.kereta.kodeKereta);
      const specGerbong = specKereta?.gerbongs.find((g) => g.nomor === dbGerbong.nomorGerbong);
      const totalBaris = specGerbong?.baris || 10;

      for (let r = 1; r <= totalBaris; r++) {
        for (const col of kolomKursi) {
          kursiPayload.push({
            gerbongId: dbGerbong.id,
            nomorKursi: `${r}${col}`,
          });
        }
      }
    }

    if (kursiPayload.length > 0) {
      await prisma.kursi.createMany({
        data: kursiPayload,
        skipDuplicates: true,
      });
    }

    // 6. Data Rute, Tarif & Jadwal RIIL PT KAI
    const ruteReal: {
      asal: string;
      tujuan: string;
      jarakKm: number;
      tarif: { kelas: KelasKereta; harga: number }[];
      keretaKode: string;
      jamBerangkat: string;
      durasiMenit: number;
    }[] = [
      {
        asal: 'GMR',
        tujuan: 'SBI',
        jarakKm: 720,
        tarif: [
          { kelas: 'EKSEKUTIF', harga: 620000 },
          { kelas: 'BISNIS', harga: 450000 },
        ],
        keretaKode: 'KA-2',
        jamBerangkat: '08:20',
        durasiMenit: 485,
      },
      {
        asal: 'GMR',
        tujuan: 'YK',
        jarakKm: 517,
        tarif: [{ kelas: 'EKSEKUTIF', harga: 490000 }],
        keretaKode: 'KA-70',
        jamBerangkat: '09:20',
        durasiMenit: 370,
      },
      {
        asal: 'GMR',
        tujuan: 'BD',
        jarakKm: 167,
        tarif: [
          { kelas: 'EKSEKUTIF', harga: 250000 },
          { kelas: 'EKONOMI', harga: 150000 },
        ],
        keretaKode: 'KA-44',
        jamBerangkat: '07:25',
        durasiMenit: 170,
      },
      {
        asal: 'GMR',
        tujuan: 'SLO',
        jarakKm: 576,
        tarif: [{ kelas: 'EKSEKUTIF', harga: 540000 }],
        keretaKode: 'KA-8',
        jamBerangkat: '20:45',
        durasiMenit: 415,
      },
      {
        asal: 'GMR',
        tujuan: 'ML',
        jarakKm: 905,
        tarif: [{ kelas: 'EKSEKUTIF', harga: 720000 }],
        keretaKode: 'KA-56',
        jamBerangkat: '18:50',
        durasiMenit: 740,
      },
      {
        asal: 'PSE',
        tujuan: 'ML',
        jarakKm: 881,
        tarif: [{ kelas: 'EKONOMI', harga: 109000 }],
        keretaKode: 'KA-234',
        jamBerangkat: '10:30',
        durasiMenit: 910,
      },
      {
        asal: 'PSE',
        tujuan: 'SBI',
        jarakKm: 719,
        tarif: [{ kelas: 'EKONOMI', harga: 290000 }],
        keretaKode: 'KA-220',
        jamBerangkat: '14:30',
        durasiMenit: 655,
      },
      {
        asal: 'GMR',
        tujuan: 'SMT',
        jarakKm: 441,
        tarif: [{ kelas: 'EKSEKUTIF', harga: 420000 }],
        keretaKode: 'KA-14',
        jamBerangkat: '07:05',
        durasiMenit: 310,
      },
      {
        asal: 'BD',
        tujuan: 'SLO',
        jarakKm: 460,
        tarif: [
          { kelas: 'EKSEKUTIF', harga: 410000 },
          { kelas: 'EKONOMI', harga: 250000 },
        ],
        keretaKode: 'KA-92',
        jamBerangkat: '06:55',
        durasiMenit: 460,
      },
      {
        asal: 'BD',
        tujuan: 'SGU',
        jarakKm: 696,
        tarif: [
          { kelas: 'EKSEKUTIF', harga: 590000 },
          { kelas: 'BISNIS', harga: 430000 },
        ],
        keretaKode: 'KA-6',
        jamBerangkat: '07:40',
        durasiMenit: 595,
      },
    ];

    await prisma.rute.createMany({
      data: ruteReal.map((r) => ({
        stasiunAsalId: stasiunMap[r.asal],
        stasiunTujuanId: stasiunMap[r.tujuan],
        jarakKm: r.jarakKm,
      })),
      skipDuplicates: true,
    });

    const allRutes = await prisma.rute.findMany();
    const ruteMap: Record<string, string> = {};
    for (const r of allRutes) {
      ruteMap[`${r.stasiunAsalId}_${r.stasiunTujuanId}`] = r.id;
    }

    // 7. Batch Insert Tarif
    const tarifPayload: { ruteId: string; kelas: KelasKereta; harga: number }[] = [];
    for (const r of ruteReal) {
      const asalId = stasiunMap[r.asal];
      const tujuanId = stasiunMap[r.tujuan];
      const rId = ruteMap[`${asalId}_${tujuanId}`];
      if (!rId) continue;

      for (const t of r.tarif) {
        tarifPayload.push({
          ruteId: rId,
          kelas: t.kelas,
          harga: t.harga,
        });
      }
    }

    await prisma.tarif.createMany({
      data: tarifPayload,
      skipDuplicates: true,
    });

    // 8. Batch Insert Jadwal untuk 7 hari ke depan (dalam 1 query!)
    const now = new Date();
    const wibTodayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
    }).format(now);

    const startDay = new Date(`${wibTodayStr}T00:00:00+07:00`);
    const existingJadwals = await prisma.jadwal.findMany({
      where: { waktuBerangkat: { gte: startDay } },
      select: { keretaId: true, ruteId: true, waktuBerangkat: true },
    });

    const existingKeys = new Set(
      existingJadwals.map(
        (j) => `${j.keretaId}_${j.ruteId}_${j.waktuBerangkat.getTime()}`
      )
    );

    const jadwalPayload: {
      keretaId: string;
      ruteId: string;
      waktuBerangkat: Date;
      waktuTiba: Date;
    }[] = [];

    for (const r of ruteReal) {
      const asalId = stasiunMap[r.asal];
      const tujuanId = stasiunMap[r.tujuan];
      const rId = ruteMap[`${asalId}_${tujuanId}`];
      const kId = keretaMap[r.keretaKode];
      if (!rId || !kId) continue;

      const baseMs = new Date(`${wibTodayStr}T${r.jamBerangkat}:00+07:00`).getTime();

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const waktuBerangkat = new Date(baseMs + dayOffset * 24 * 60 * 60 * 1000);
        const waktuTiba = new Date(waktuBerangkat.getTime() + r.durasiMenit * 60 * 1000);
        const key = `${kId}_${rId}_${waktuBerangkat.getTime()}`;

        if (!existingKeys.has(key)) {
          jadwalPayload.push({
            keretaId: kId,
            ruteId: rId,
            waktuBerangkat,
            waktuTiba,
          });
        }
      }
    }

    if (jadwalPayload.length > 0) {
      await prisma.jadwal.createMany({
        data: jadwalPayload,
      });
    }

    const durasiDetik = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: `Data RIIL PT KAI berhasil disimpan ke Supabase dalam ${durasiDetik} detik!`,
      summary: {
        stasiun: allStasiun.length,
        kereta: allKereta.length,
        kursiBaruDibuat: kursiPayload.length,
        jadwalBaruDibuat: jadwalPayload.length,
      },
    });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal terhubung atau melakukan seed ke database Supabase.',
      },
      { status: 500 }
    );
  }
}