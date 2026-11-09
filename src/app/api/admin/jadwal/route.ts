import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asalId = searchParams.get('asalId');
    const tujuanId = searchParams.get('tujuanId');

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
    // Jangan tangkap sinyal prerender internal Next.js
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }

    console.error('[API JADWAL ERROR]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil jadwal.' },
      { status: 500 }
    );
  }
}