import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Baca parameter URL di luar try-catch agar kompatibel dengan Next.js 16
  const searchParams = request.nextUrl.searchParams;
  const asalId = searchParams.get('asalId');
  const tujuanId = searchParams.get('tujuanId');
  const tanggal = searchParams.get('tanggal');
  const keretaNama = searchParams.get('q');

  try {
    const whereClause: any = {};

    if (asalId || tujuanId) {
      whereClause.rute = {};
      if (asalId) whereClause.rute.stasiunAsalId = asalId;
      if (tujuanId) whereClause.rute.stasiunTujuanId = tujuanId;
    }

    if (keretaNama) {
      whereClause.kereta = {
        OR: [
          { namaKereta: { contains: keretaNama, mode: 'insensitive' } },
          { kodeKereta: { contains: keretaNama, mode: 'insensitive' } },
        ],
      };
    }

    if (tanggal) {
      const startOfDay = new Date(`${tanggal}T00:00:00+07:00`);
      const endOfDay = new Date(`${tanggal}T23:59:59.999+07:00`);
      if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
        whereClause.waktuBerangkat = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    } else {
      // Tampilkan jadwal mulai dari 2 jam yang lalu ke depan
      whereClause.waktuBerangkat = {
        gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };
    }

    const jadwalList = await prisma.jadwal.findMany({
      where: whereClause,
      include: {
        kereta: {
          include: {
            gerbong: {
              include: {
                _count: {
                  select: { kursi: true },
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
        detailTiket: {
          where: {
            pemesanan: {
              statusPembayaran: {
                not: 'CANCELLED',
              },
            },
          },
          include: {
            kursi: {
              include: {
                gerbong: {
                  select: { kelas: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        waktuBerangkat: 'asc',
      },
      take: 50,
    });

    const formatted = jadwalList.map((jadwal) => {
      // Hitung kapasitas & kursi terpakai per kelas
      const kapasitasPerKelas: Record<string, number> = {};
      for (const g of jadwal.kereta.gerbong) {
        kapasitasPerKelas[g.kelas] = (kapasitasPerKelas[g.kelas] || 0) + g._count.kursi;
      }

      const terisiPerKelas: Record<string, number> = {};
      for (const dt of jadwal.detailTiket) {
        const kls = dt.kursi.gerbong.kelas;
        terisiPerKelas[kls] = (terisiPerKelas[kls] || 0) + 1;
      }

      const kelasTersedia = jadwal.rute.tarif
        .filter((t) => (kapasitasPerKelas[t.kelas] || 0) > 0)
        .map((t) => {
          const total = kapasitasPerKelas[t.kelas] || 0;
          const terisi = terisiPerKelas[t.kelas] || 0;
          return {
            kelas: t.kelas,
            harga: Number(t.harga),
            totalKursi: total,
            sisaKursi: Math.max(0, total - terisi),
          };
        });

      return {
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
        kelasTersedia,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error GET /api/jadwal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data jadwal.' },
      { status: 500 }
    );
  }
}