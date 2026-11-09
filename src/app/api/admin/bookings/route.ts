import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Mengambil seluruh riwayat pemesanan tiket untuk admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const whereClause: any = {};

    if (status && status !== 'SEMUA') {
      whereClause.statusPembayaran = status;
    }

    if (search) {
      whereClause.OR = [
        { kodeBooking: { contains: search, mode: 'insensitive' } },
        { user: { nama: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const bookings = await prisma.pemesanan.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            phone: true,
          },
        },
        jadwal: {
          include: {
            kereta: true,
            rute: {
              include: {
                stasiunAsal: true,
                stasiunTujuan: true,
              },
            },
          },
        },
        detailTiket: {
          include: {
            kursi: {
              include: {
                gerbong: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/bookings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data pemesanan.' },
      { status: 500 }
    );
  }
}

// POST: Membuat atau seeding data pemesanan tiket baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      jadwalId,
      penumpangNama,
      penumpangIdentitas,
      kursiId,
      totalBayar,
    } = body;

    // Pastikan user ada
    let targetUserId = userId;
    if (!targetUserId) {
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return NextResponse.json(
          { success: false, error: 'Belum ada data user di database.' },
          { status: 400 }
        );
      }
      targetUserId = defaultUser.id;
    }

    // Pastikan jadwal ada
    let targetJadwalId = jadwalId;
    if (!targetJadwalId) {
      const defaultJadwal = await prisma.jadwal.findFirst();
      if (!defaultJadwal) {
        // Buat stasiun, rute, kereta dan jadwal sampel jika database masih kosong
        const stasiunAsal = await prisma.stasiun.upsert({
          where: { kodeStasiun: 'GMR' },
          update: {},
          create: { kodeStasiun: 'GMR', namaStasiun: 'Gambir', kota: 'Jakarta Pusat' },
        });

        const stasiunTujuan = await prisma.stasiun.upsert({
          where: { kodeStasiun: 'SBI' },
          update: {},
          create: { kodeStasiun: 'SBI', namaStasiun: 'Surabaya Pasarturi', kota: 'Surabaya' },
        });

        const rute = await prisma.rute.upsert({
          where: {
            stasiunAsalId_stasiunTujuanId: {
              stasiunAsalId: stasiunAsal.id,
              stasiunTujuanId: stasiunTujuan.id,
            },
          },
          update: {},
          create: {
            stasiunAsalId: stasiunAsal.id,
            stasiunTujuanId: stasiunTujuan.id,
            jarakKm: 720.5,
          },
        });

        const kereta = await prisma.kereta.upsert({
          where: { kodeKereta: 'ABA-01' },
          update: {},
          create: {
            namaKereta: 'Argo Bromo Anggrek',
            kodeKereta: 'ABA-01',
          },
        });

        const newJadwal = await prisma.jadwal.create({
          data: {
            keretaId: kereta.id,
            ruteId: rute.id,
            waktuBerangkat: new Date(Date.now() + 3600000 * 24),
            waktuTiba: new Date(Date.now() + 3600000 * 32),
          },
        });
        targetJadwalId = newJadwal.id;
      } else {
        targetJadwalId = defaultJadwal.id;
      }
    }

    // Pastikan kursi ada
    let targetKursiId = kursiId;
    if (!targetKursiId) {
      const defaultKursi = await prisma.kursi.findFirst();
      if (!defaultKursi) {
        const targetKereta = await prisma.kereta.findFirst();
        if (!targetKereta) {
          throw new Error('Data kereta tidak ditemukan.');
        }

        const gerbong = await prisma.gerbong.create({
          data: {
            keretaId: targetKereta.id,
            namaGerbong: 'Eksekutif 1',
            nomorGerbong: 1,
            kelas: 'EKSEKUTIF',
          },
        });

        const kursiBaru = await prisma.kursi.create({
          data: {
            gerbongId: gerbong.id,
            nomorKursi: '1A',
          },
        });
        targetKursiId = kursiBaru.id;
      } else {
        targetKursiId = defaultKursi.id;
      }
    }

    // Generate kode booking unik format RLK-XXXXX
    const kodeBooking = `RLK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Waktu kedaluwarsa: 15 menit dari waktu pemesanan sesuai requirement
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

    // Simpan transaksi pemesanan lengkap dengan expiredAt
    const result = await prisma.pemesanan.create({
      data: {
        kodeBooking,
        userId: targetUserId,
        jadwalId: targetJadwalId,
        statusPembayaran: 'PAID',
        totalBayar: totalBayar || 550000,
        expiredAt,
        detailTiket: {
          create: {
            jadwalId: targetJadwalId,
            penumpangNama: penumpangNama || 'Budi Santoso',
            penumpangIdentitas: penumpangIdentitas || '3201234567890001',
            kursiId: targetKursiId,
            statusTiket: 'BOOKED',
          },
        },
      },
      include: {
        detailTiket: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pemesanan berhasil dibuat.',
      data: result,
    });
  } catch (error: any) {
    console.error('Error POST /api/admin/bookings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat pemesanan tiket.' },
      { status: 500 }
    );
  }
}