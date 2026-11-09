import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Mengambil daftar jadwal kereta untuk API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const jadwalList = await prisma.jadwal.findMany({
      include: {
        kereta: true,
        rute: {
          include: {
            stasiunAsal: true,
            stasiunTujuan: true,
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
    console.error('Error GET /api/admin/jadwal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data jadwal.' },
      { status: 500 }
    );
  }
}

// POST: Membuat jadwal keberangkatan kereta baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keretaId, ruteId, waktuBerangkat, waktuTiba } = body;

    if (!keretaId || !ruteId || !waktuBerangkat || !waktuTiba) {
      return NextResponse.json(
        { success: false, error: 'Data parameter jadwal tidak lengkap.' },
        { status: 400 }
      );
    }

    const newJadwal = await prisma.jadwal.create({
      data: {
        keretaId,
        ruteId,
        waktuBerangkat: new Date(waktuBerangkat),
        waktuTiba: new Date(waktuTiba),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal berhasil ditambahkan ke database.',
      data: newJadwal,
    });
  } catch (error: any) {
    console.error('Error POST /api/admin/jadwal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan jadwal.' },
      { status: 500 }
    );
  }
}