import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['ADMIN']);
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : '';
    return NextResponse.json(
      {
        success: false,
        error: msg === 'FORBIDDEN' ? 'Akses ditolak. Khusus Admin.' : 'Silakan login sebagai Admin.',
      },
      { status: msg === 'FORBIDDEN' ? 403 : 401 }
    );
  }

  try {
    const [bookings, stasiunRows, keretaRows] = await Promise.all([
      prisma.pemesanan.findMany({
        include: {
          user: true,
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
      }),
      prisma.stasiun.findMany({
        select: { kodeStasiun: true },
        orderBy: { kodeStasiun: 'asc' },
      }),
      prisma.kereta.findMany({
        select: { namaKereta: true },
        orderBy: { namaKereta: 'asc' },
      }),
    ]);

    const totalPesanan = bookings.length;
    const pendingCount = bookings.filter((b) => b.statusPembayaran === 'PENDING').length;
    const paidCount = bookings.filter((b) => b.statusPembayaran === 'PAID').length;
    const totalPendapatan = bookings
      .filter((b) => b.statusPembayaran === 'PAID')
      .reduce((acc, curr) => acc + Number(curr.totalBayar), 0);

    const stasiunSample = stasiunRows
      .slice(0, 4)
      .map((s) => s.kodeStasiun)
      .join(', ');
    const keretaSample = keretaRows
      .slice(0, 3)
      .map((k) => k.namaKereta)
      .join(', ');

    return NextResponse.json({
      success: true,
      stats: {
        totalPesanan,
        pendingCount,
        paidCount,
        totalPendapatan,
        totalStasiun: stasiunRows.length,
        keretaAktif: keretaRows.length,
        stasiunSample: stasiunSample ? `${stasiunSample}, dll.` : 'Belum ada data stasiun',
        keretaSample: keretaSample ? `${keretaSample}, dll.` : 'Belum ada data kereta',
      },
      bookings: bookings.map((b) => ({
        id: b.id,
        kodeBooking: b.kodeBooking,
        pemesanNama: b.user?.nama || 'Penumpang KAI',
        pemesanEmail: b.user?.email || '-',
        penumpangList: b.detailTiket.map((t) => ({
          nama: t.penumpangNama,
          identitas: t.penumpangIdentitas,
          kursi: t.kursi
            ? `${t.kursi.gerbong?.namaGerbong || ''} ${t.kursi.nomorKursi}`.trim()
            : '-',
          statusTiket: t.statusTiket,
        })),
        namaKereta: b.jadwal?.kereta?.namaKereta || '-',
        rute: b.jadwal?.rute
          ? `${b.jadwal.rute.stasiunAsal.kodeStasiun} → ${b.jadwal.rute.stasiunTujuan.kodeStasiun}`
          : '-',
        totalBayar: Number(b.totalBayar),
        statusPembayaran: b.statusPembayaran,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[API ADMIN GET ERROR]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data dari database Supabase.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(['ADMIN']);
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : '';
    return NextResponse.json(
      {
        success: false,
        error: msg === 'FORBIDDEN' ? 'Akses ditolak. Khusus Admin.' : 'Silakan login sebagai Admin.',
      },
      { status: msg === 'FORBIDDEN' ? 403 : 401 }
    );
  }

  try {
    const body = await request.json();
    const { kodeBooking, statusPembayaran } = body;

    if (!kodeBooking) {
      return NextResponse.json({ error: 'Kode booking wajib diisi.' }, { status: 400 });
    }

    const updated = await prisma.pemesanan.update({
      where: { kodeBooking },
      data: {
        statusPembayaran: statusPembayaran || 'PAID',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Tiket ${kodeBooking} berhasil diubah ke ${statusPembayaran || 'PAID'}!`,
      booking: updated,
    });
  } catch (error) {
    console.error('[API ADMIN PATCH ERROR]:', error);
    return NextResponse.json({ error: 'Gagal mengubah status pembayaran.' }, { status: 500 });
  }
}