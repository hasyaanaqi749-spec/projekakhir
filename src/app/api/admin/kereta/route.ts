// src/app/api/admin/kereta/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const createTrainSchema = z.object({
  action: z.literal('ADD_TRAIN'),
  kodeKereta: z
    .string()
    .trim()
    .min(2, 'Kode kereta minimal 2 karakter.')
    .max(20, 'Kode kereta maksimal 20 karakter.')
    .transform((v) => v.toUpperCase()),
  namaKereta: z
    .string()
    .trim()
    .min(3, 'Nama kereta minimal 3 karakter.')
    .max(100, 'Nama kereta maksimal 100 karakter.'),
});

const createGerbongSchema = z.object({
  action: z.literal('ADD_GERBONG').optional(),
  keretaId: z.string().uuid('Format keretaId tidak valid.'),
  namaGerbong: z.string().trim().min(2, 'Nama gerbong minimal 2 karakter.').max(50),
  nomorGerbong: z.coerce.number().int().min(1, 'Nomor gerbong minimal 1.'),
  kelas: z.enum(['EKSEKUTIF', 'BISNIS', 'EKONOMI']),
  totalBaris: z.coerce.number().int().min(5).max(16).default(10),
});

async function verifyAdmin() {
  let user: { id?: string; userId?: string; role?: string } | null = null;
  try {
    user = await getSessionUser();
  } catch {
    user = null;
  }

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden. Akses khusus Administrator.' },
      { status: 403 }
    );
  }
  return null;
}

export async function GET() {
  const authError = await verifyAdmin();
  if (authError) return authError;

  try {
    const trains = await prisma.kereta.findMany({
      orderBy: { kodeKereta: 'asc' },
      include: {
        gerbong: {
          orderBy: { nomorGerbong: 'asc' },
          include: {
            _count: {
              select: { kursi: true },
            },
          },
        },
      },
    });

    const formatted = trains.map((t) => ({
      id: t.id,
      kodeKereta: t.kodeKereta,
      namaKereta: t.namaKereta,
      gerbong: t.gerbong.map((g) => ({
        id: g.id,
        nomorGerbong: g.nomorGerbong,
        namaGerbong: g.namaGerbong,
        kelas: g.kelas,
        totalKursi: g._count.kursi,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('GET /api/admin/kereta error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data kereta dan gerbong.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    if (body?.action === 'ADD_TRAIN') {
      const parsed = createTrainSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || 'Data kereta tidak valid.' },
          { status: 400 }
        );
      }

      const existing = await prisma.kereta.findUnique({
        where: { kodeKereta: parsed.data.kodeKereta },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Kode kereta ${parsed.data.kodeKereta} sudah terdaftar.` },
          { status: 400 }
        );
      }

      const created = await prisma.kereta.create({
        data: {
          kodeKereta: parsed.data.kodeKereta,
          namaKereta: parsed.data.namaKereta,
        },
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    const parsed = createGerbongSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data gerbong tidak valid.' },
        { status: 400 }
      );
    }

    const { keretaId, namaGerbong, nomorGerbong, kelas, totalBaris } = parsed.data;

    const existingNomor = await prisma.gerbong.findFirst({
      where: { keretaId, nomorGerbong },
    });
    if (existingNomor) {
      return NextResponse.json(
        {
          success: false,
          error: `Gerbong nomor #${nomorGerbong} sudah terdaftar pada rangkaian kereta ini.`,
        },
        { status: 400 }
      );
    }

    const columns = ['A', 'B', 'C', 'D'];
    const result = await prisma.$transaction(async (tx) => {
      const gerbong = await tx.gerbong.create({
        data: {
          keretaId,
          namaGerbong,
          nomorGerbong,
          kelas,
        },
      });

      const seatRows: { gerbongId: string; nomorKursi: string }[] = [];
      for (let row = 1; row <= totalBaris; row++) {
        for (const col of columns) {
          seatRows.push({
            gerbongId: gerbong.id,
            nomorKursi: `${row}${col}`,
          });
        }
      }

      await tx.kursi.createMany({ data: seatRows });
      return { gerbong, totalKursi: seatRows.length };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/kereta error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data kereta / gerbong.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await verifyAdmin();
  if (authError) return authError;

  try {
    const type = request.nextUrl.searchParams.get('type') || 'gerbong';
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan.' }, { status: 400 });
    }

    if (type === 'kereta') {
      await prisma.kereta.delete({ where: { id } });
    } else {
      await prisma.gerbong.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const prismaCode = (error as { code?: string })?.code;
    if (prismaCode === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tidak bisa dihapus karena masih terhubung ke jadwal perjalanan atau tiket yang sudah dipesan.',
        },
        { status: 400 }
      );
    }
    console.error('DELETE /api/admin/kereta error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus data.' },
      { status: 500 }
    );
  }
}