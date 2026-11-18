import { NextRequest, NextResponse } from 'next/server';
import { KelasKereta } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

const upsertTarifSchema = z.object({
  ruteId: z.string().uuid('Format ruteId tidak valid.'),
  kelas: z.enum(['EKSEKUTIF', 'BISNIS', 'EKONOMI']),
  harga: z.number().min(10000, 'Harga tarif minimal Rp 10.000.'),
});

const updateTarifSchema = z.object({
  id: z.string().uuid('Format id tarif tidak valid.'),
  harga: z.number().min(10000, 'Harga tarif minimal Rp 10.000.'),
});

async function checkAdmin() {
  try {
    await requireRole(['ADMIN']);
    return null;
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : '';
    return NextResponse.json(
      {
        success: false,
        error:
          msg === 'FORBIDDEN'
            ? 'Akses ditolak. Khusus Admin.'
            : 'Silakan login sebagai Admin.',
      },
      { status: msg === 'FORBIDDEN' ? 403 : 401 }
    );
  }
}

export async function GET() {
  const denied = await checkAdmin();
  if (denied) return denied;

  try {
    const [tarifRows, ruteRows] = await Promise.all([
      prisma.tarif.findMany({
        include: {
          rute: {
            include: {
              stasiunAsal: true,
              stasiunTujuan: true,
            },
          },
        },
        orderBy: [
          { rute: { stasiunAsal: { kodeStasiun: 'asc' } } },
          { kelas: 'asc' },
        ],
      }),
      prisma.rute.findMany({
        include: {
          stasiunAsal: true,
          stasiunTujuan: true,
        },
        orderBy: { stasiunAsal: { kodeStasiun: 'asc' } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tarif: tarifRows.map((t) => ({
        id: t.id,
        ruteId: t.ruteId,
        kelas: t.kelas,
        harga: Number(t.harga),
        updatedAt: t.updatedAt.toISOString(),
        stasiunAsal: `${t.rute.stasiunAsal.namaStasiun} (${t.rute.stasiunAsal.kodeStasiun})`,
        stasiunTujuan: `${t.rute.stasiunTujuan.namaStasiun} (${t.rute.stasiunTujuan.kodeStasiun})`,
        jarakKm: Number(t.rute.jarakKm),
      })),
      ruteList: ruteRows.map((r) => ({
        id: r.id,
        label: `${r.stasiunAsal.namaStasiun} (${r.stasiunAsal.kodeStasiun}) → ${r.stasiunTujuan.namaStasiun} (${r.stasiunTujuan.kodeStasiun})`,
        jarakKm: Number(r.jarakKm),
      })),
    });
  } catch (error) {
    console.error('Error GET /api/admin/tarif:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data tarif dari Supabase.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await checkAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = upsertTarifSchema.safeParse({
      ruteId: body.ruteId,
      kelas: body.kelas,
      harga: Number(body.harga),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Data tarif tidak valid.',
        },
        { status: 400 }
      );
    }

    const saved = await prisma.tarif.upsert({
      where: {
        ruteId_kelas: {
          ruteId: parsed.data.ruteId,
          kelas: parsed.data.kelas as KelasKereta,
        },
      },
      update: {
        harga: parsed.data.harga,
      },
      create: {
        ruteId: parsed.data.ruteId,
        kelas: parsed.data.kelas as KelasKereta,
        harga: parsed.data.harga,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Tarif berhasil disimpan ke Supabase.',
        data: { ...saved, harga: Number(saved.harga) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error POST /api/admin/tarif:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan tarif.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await checkAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = updateTarifSchema.safeParse({
      id: body.id,
      harga: Number(body.harga),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Input ubah tarif tidak valid.',
        },
        { status: 400 }
      );
    }

    const updated = await prisma.tarif.update({
      where: { id: parsed.data.id },
      data: { harga: parsed.data.harga },
    });

    return NextResponse.json({
      success: true,
      message: 'Tarif berhasil diperbarui di Supabase.',
      data: { ...updated, harga: Number(updated.harga) },
    });
  } catch (error) {
    console.error('Error PATCH /api/admin/tarif:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui tarif.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const denied = await checkAdmin();
  if (denied) return denied;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Parameter id tarif wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    await prisma.tarif.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      message: 'Tarif berhasil dihapus.',
    });
  } catch (error) {
    console.error('Error DELETE /api/admin/tarif:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus tarif.' },
      { status: 500 }
    );
  }
}