import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['PETUGAS', 'ADMIN']);
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : '';
    return NextResponse.json(
      {
        success: false,
        error:
          msg === 'FORBIDDEN'
            ? 'Akses ditolak. Khusus Petugas atau Admin.'
            : 'Silakan login sebagai Petugas.',
      },
      { status: msg === 'FORBIDDEN' ? 403 : 401 }
    );
  }

  try {
    const paidBookings = await prisma.pemesanan.findMany({
      where: {
        statusPembayaran: 'PAID',
      },
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
    });

    const ticketList = [];

    for (const booking of paidBookings) {
      if (booking.detailTiket && booking.detailTiket.length > 0) {
        for (const dt of booking.detailTiket) {
          ticketList.push({
            id: dt.id,
            ticketId: dt.id,
            bookingId: booking.id,
            penumpangNama: dt.penumpangNama || booking.user?.nama || 'Penumpang KAI',
            nama: dt.penumpangNama || booking.user?.nama || 'Penumpang KAI',
            namaPenumpang: dt.penumpangNama || booking.user?.nama || 'Penumpang KAI',
            penumpangIdentitas: dt.penumpangIdentitas || '-',
            identitas: dt.penumpangIdentitas || '-',
            nik: dt.penumpangIdentitas || '-',
            statusTiket: dt.statusTiket || 'BOOKED',
            status: dt.statusTiket || 'BOOKED',
            isBoarded: dt.statusTiket === 'BOARDED',
            kodeBooking: booking.kodeBooking || '-',
            nomorKursi: dt.kursi?.nomorKursi || '-',
            kursi: dt.kursi?.nomorKursi || '-',
            gerbong: dt.kursi?.gerbong?.nomorGerbong
              ? `Gerbong ${dt.kursi.gerbong.nomorGerbong}`
              : 'Gerbong 1',
            namaKereta: booking.jadwal?.kereta?.namaKereta || '-',
            rute: booking.jadwal?.rute
              ? `${booking.jadwal.rute.stasiunAsal?.namaStasiun || '-'} → ${booking.jadwal.rute.stasiunTujuan?.namaStasiun || '-'}`
              : '-',
            createdAt: dt.createdAt || booking.createdAt,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: ticketList,
      total: ticketList.length,
      boardedCount: ticketList.filter((t) => t.statusTiket === 'BOARDED').length,
      unboardedCount: ticketList.filter((t) => t.statusTiket !== 'BOARDED').length,
    });
  } catch (error) {
    console.error('Error fetching tickets for petugas:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Gagal memuat daftar tiket petugas',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(['PETUGAS', 'ADMIN']);
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : '';
    return NextResponse.json(
      {
        success: false,
        error:
          msg === 'FORBIDDEN'
            ? 'Akses ditolak. Khusus Petugas atau Admin.'
            : 'Silakan login sebagai Petugas.',
      },
      { status: msg === 'FORBIDDEN' ? 403 : 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const ticketId = body.id || body.ticketId;
    const kodeBooking = String(body.kodeBooking || body.kode || '')
      .trim()
      .toUpperCase();

    if (ticketId) {
      const updated = await prisma.detailTiket.update({
        where: { id: String(ticketId) },
        data: { statusTiket: 'BOARDED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Check-in berhasil (Status: BOARDED).',
        data: updated,
      });
    }

    if (kodeBooking) {
      const booking = await prisma.pemesanan.findFirst({
        where: { kodeBooking },
        include: { detailTiket: true },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, error: `Kode Booking ${kodeBooking} tidak ditemukan.` },
          { status: 404 }
        );
      }

      if (booking.statusPembayaran !== 'PAID') {
        return NextResponse.json(
          {
            success: false,
            error: `Tiket belum lunas (Status: ${booking.statusPembayaran}).`,
          },
          { status: 400 }
        );
      }

      await prisma.detailTiket.updateMany({
        where: { pemesananId: booking.id },
        data: { statusTiket: 'BOARDED' },
      });

      return NextResponse.json({
        success: true,
        message: `Kode ${kodeBooking} berhasil check-in (BOARDED).`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Parameter ID atau Kode Booking diperlukan.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error validating check-in:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal check-in.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}