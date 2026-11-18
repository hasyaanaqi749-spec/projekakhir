import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KelasKereta } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jadwalId = searchParams.get('jadwalId');
  const kelasParam = searchParams.get('kelas') as KelasKereta | null;

  if (!jadwalId) {
    return NextResponse.json(
      { success: false, error: 'Parameter jadwalId wajib disertakan.' },
      { status: 400 }
    );
  }

  try {
    const jadwal = await prisma.jadwal.findUnique({
      where: { id: jadwalId },
      include: {
        kereta: {
          include: {
            gerbong: {
              where: kelasParam ? { kelas: kelasParam } : undefined,
              orderBy: { nomorGerbong: 'asc' },
              include: {
                kursi: {
                  orderBy: { nomorKursi: 'asc' },
                },
              },
            },
          },
        },
        rute: {
          include: {
            stasiunAsal: true,
            stasiunTujuan: true,
            tarif: true,
          },
        },
      },
    });

    if (!jadwal) {
      return NextResponse.json(
        { success: false, error: 'Jadwal tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Ambil seluruh kursi yang sudah dibooking aktif (PENDING / PAID & belum CANCELLED)
    const tiketAktif = await prisma.detailTiket.findMany({
      where: {
        jadwalId: jadwal.id,
        pemesanan: {
          statusPembayaran: {
            not: 'CANCELLED',
          },
        },
      },
      select: {
        kursiId: true,
      },
    });

    const bookedSeatIds = new Set(tiketAktif.map((t) => t.kursiId));

    // Urutkan kursi secara numerik-alfabetis (1A, 1B, ..., 2A, ..., 10D)
    const sortSeat = (a: string, b: string) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    };

    const gerbongData = jadwal.kereta.gerbong.map((g) => ({
      id: g.id,
      namaGerbong: g.namaGerbong,
      nomorGerbong: g.nomorGerbong,
      kelas: g.kelas,
      kursi: [...g.kursi]
        .sort((a, b) => sortSeat(a.nomorKursi, b.nomorKursi))
        .map((k) => ({
          id: k.id,
          nomorKursi: k.nomorKursi,
          isBooked: bookedSeatIds.has(k.id),
        })),
    }));

    const tarifTerpilih = jadwal.rute.tarif.find(
      (t) => !kelasParam || t.kelas === kelasParam
    );

    return NextResponse.json({
      success: true,
      data: {
        jadwal: {
          id: jadwal.id,
          waktuBerangkat: jadwal.waktuBerangkat,
          waktuTiba: jadwal.waktuTiba,
          kereta: {
            id: jadwal.kereta.id,
            namaKereta: jadwal.kereta.namaKereta,
            kodeKereta: jadwal.kereta.kodeKereta,
          },
          rute: {
            id: jadwal.rute.id,
            jarakKm: Number(jadwal.rute.jarakKm),
            stasiunAsal: jadwal.rute.stasiunAsal,
            stasiunTujuan: jadwal.rute.stasiunTujuan,
          },
        },
        hargaPerKursi: tarifTerpilih ? Number(tarifTerpilih.harga) : 0,
        gerbong: gerbongData,
      },
    });
  } catch (error: any) {
    console.error('Error GET /api/kursi:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat layout kursi.' },
      { status: 500 }
    );
  }
}