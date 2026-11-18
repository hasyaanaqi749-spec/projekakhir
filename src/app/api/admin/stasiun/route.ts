// src/app/api/admin/stasiun/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const stasiunSchema = z.object({
  kodeStasiun: z
    .string()
    .trim()
    .min(2, 'Kode stasiun minimal 2 karakter.')
    .max(10, 'Kode stasiun maksimal 10 karakter.')
    .transform((v) => v.toUpperCase()),
  namaStasiun: z
    .string()
    .trim()
    .min(3, 'Nama stasiun minimal 3 karakter.')
    .max(100, 'Nama stasiun maksimal 100 karakter.'),
  kota: z
    .string()
    .trim()
    .min(3, 'Nama kota minimal 3 karakter.')
    .max(100, 'Nama kota maksimal 100 karakter.'),
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
    const stations = await prisma.stasiun.findMany({
      orderBy: { kodeStasiun: 'asc' },
    });
    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
    console.error('GET /api/admin/stasiun error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data stasiun dari database.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = stasiunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data stasiun tidak valid.' },
        { status: 400 }
      );
    }

    const existing = await prisma.stasiun.findUnique({
      where: { kodeStasiun: parsed.data.kodeStasiun },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Kode stasiun ${parsed.data.kodeStasiun} sudah terdaftar.` },
        { status: 400 }
      );
    }

    const created = await prisma.stasiun.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/stasiun error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan stasiun baru.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await verifyAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID stasiun wajib diisi.' }, { status: 400 });
    }

    const parsed = stasiunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data stasiun tidak valid.' },
        { status: 400 }
      );
    }

    const duplicate = await prisma.stasiun.findFirst({
      where: {
        kodeStasiun: parsed.data.kodeStasiun,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: `Kode stasiun ${parsed.data.kodeStasiun} sudah digunakan stasiun lain.` },
        { status: 400 }
      );
    }

    const updated = await prisma.stasiun.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/admin/stasiun error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui data stasiun.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await verifyAdmin();
  if (authError) return authError;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID stasiun tidak ditemukan.' }, { status: 400 });
    }

    await prisma.stasiun.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const prismaCode = (error as { code?: string })?.code;
    if (prismaCode === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'Stasiun tidak bisa dihapus karena masih digunakan pada data Rute / Jadwal aktif.',
        },
        { status: 400 }
      );
    }
    console.error('DELETE /api/admin/stasiun error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus data stasiun.' },
      { status: 500 }
    );
  }
}