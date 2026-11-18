import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Ambil detail pemesanan berdasarkan kodeBooking
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ kodeBooking: string }> }
) {
  try {
    const { kodeBooking } = await context.params;
    const cleanCode = decodeURIComponent(kodeBooking).trim().toUpperCase();

    const pemesanan = await prisma.pemesanan.findUnique({
      where: { kodeBooking: cleanCode },
      include: {
        user: {
          select: { id: true, nama: true, email: true, phone: true },
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
              include: { gerbong: true },
            },
          },
        },
      },
    });

    if (!pemesanan) {
      return NextResponse.json(
        { success: false, error: `Kode booking ${cleanCode} tidak ditemukan di database.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...pemesanan,
        totalBayar: Number(pemesanan.totalBayar),
        jadwal: {
          ...pemesanan.jadwal,
          rute: {
            ...pemesanan.jadwal.rute,
            jarakKm: Number(pemesanan.jadwal.rute.jarakKm),
          },
        },
      },
    });
  } catch (error: any) {
    console.error('Error GET /api/pemesanan/[kodeBooking]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data e-tiket.' },
      { status: 500 }
    );
  }
}

// PATCH: Konfirmasi Pembayaran Tiket (PENDING -> PAID)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ kodeBooking: string }> }
) {
  try {
    const { kodeBooking } = await context.params;
    const cleanCode = decodeURIComponent(kodeBooking).trim().toUpperCase();
    const body = await request.json().catch(() => ({}));
    const action = body?.action || 'PAY';

    const existing = await prisma.pemesanan.findUnique({
      where: { kodeBooking: cleanCode },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kode booking tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (action === 'CANCEL') {
      if (existing.statusPembayaran === 'PAID') {
        return NextResponse.json(
          { success: false, error: 'Pesanan yang sudah dibayar tidak dapat dibatalkan di sini.' },
          { status: 400 }
        );
      }

      const cancelled = await prisma.pemesanan.update({
        where: { id: existing.id },
        data: { statusPembayaran: 'CANCELLED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Pemesanan telah dibatalkan dan kursi dilepas kembali.',
        data: { ...cancelled, totalBayar: Number(cancelled.totalBayar) },
      });
    }

    if (existing.statusPembayaran === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Pesanan ini sudah kedaluwarsa atau dibatalkan.' },
        { status: 400 }
      );
    }

    const updated = await prisma.pemesanan.update({
      where: { id: existing.id },
      data: { statusPembayaran: 'PAID' },
    });

    return NextResponse.json({
      success: true,
      message: `Pembayaran untuk kode booking ${cleanCode} berhasil dikonfirmasi!`,
      data: {
        ...updated,
        totalBayar: Number(updated.totalBayar),
      },
    });
  } catch (error: any) {
    console.error('Error PATCH /api/pemesanan/[kodeBooking]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses pembayaran.' },
      { status: 500 }
    );
  }
}