import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // 1. Ambil query params menggunakan request.nextUrl DI LUAR try-catch
  // Ini mencegah error NEXT_PRERENDER_INTERRUPTED saat build di Vercel
  const searchParams = request.nextUrl.searchParams;
  const asalId = searchParams.get('asalId');
  const tujuanId = searchParams.get('tujuanId');

  // 2. Query data ke database Supabase
  try {
    const whereClause: any = {};

    if (asalId || tujuanId) {
      whereClause.rute = {};
      if (asalId) whereClause.rute.stasiunAsalId = asalId;
      if (tujuanId) whereClause.rute.stasiunTujuanId = tujuanId;
    }

    const jadwalList = await prisma.jadwal.findMany({
      where: whereClause,
      include: {
        kereta: true,
        rute: {
          include: {
            stasiunAsal: true,
            stasiunTujuan: true,
            tarif: true,
          },
        },
      },
      orderBy: {
        waktuBerangkat: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: jadwalList,
    });
  } catch (error: any) {
    console.error('Error database jadwal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil jadwal.' },
      { status: 500 }
    );
  }
}