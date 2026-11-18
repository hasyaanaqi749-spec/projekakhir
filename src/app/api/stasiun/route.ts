import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stasiunList = await prisma.stasiun.findMany({
      orderBy: { namaStasiun: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: stasiunList,
    });
  } catch (error: any) {
    console.error('Error GET /api/stasiun:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil daftar stasiun.' },
      { status: 500 }
    );
  }
}