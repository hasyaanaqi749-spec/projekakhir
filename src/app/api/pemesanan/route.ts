import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const createBookingSchema = z.object({
  jadwalId: z.string().uuid('Format jadwalId tidak valid.'),
  kelas: z.enum(['EKSEKUTIF', 'BISNIS', 'EKONOMI']),
  penumpang: z
    .array(
      z.object({
        nama: z.string().min(3, 'Nama penumpang minimal 3 karakter.').max(150),
        identitas: z
          .string()
          .min(10, 'Nomor identitas (NIK / Paspor) minimal 10 karakter.')
          .max(50),
        kursiId: z.string().uuid('Format kursiId tidak valid.'),
      })
    )
    .min(1, 'Minimal harus ada 1 penumpang.')
    .max(4, 'Maksimal 4 penumpang dalam 1 pemesanan.'),
});

// GET: Ambil riwayat pemesanan milik user login (atau berdasarkan kodeBooking)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kodeBooking = searchParams.get('kodeBooking');

  try {
    let sessionUser: any = null;
    try {
      sessionUser = await getSessionUser();
    } catch {
      sessionUser = null;
    }

    const activeUserId = sessionUser?.id || sessionUser?.userId;

    if (kodeBooking) {
      const booking = await prisma.pemesanan.findUnique({
        where: { kodeBooking: kodeBooking.trim().toUpperCase() },
        include: {
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

      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Kode booking tidak ditemukan.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...booking,
          totalBayar: Number(booking.totalBayar),
        },
      });
    }

    if (!activeUserId) {
      return NextResponse.json(
        { success: false, error: 'Silakan login untuk melihat riwayat pemesanan Anda.' },
        { status: 401 }
      );
    }

    const bookings = await prisma.pemesanan.findMany({
      where: { userId: activeUserId },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: bookings.map((b) => ({
        ...b,
        totalBayar: Number(b.totalBayar),
      })),
    });
  } catch (error: any) {
    console.error('Error GET /api/pemesanan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil riwayat pemesanan.' },
      { status: 500 }
    );
  }
}

// POST: Buat pemesanan tiket baru dan simpan ke database Supabase
export async function POST(request: NextRequest) {
  try {
    // 1. Validasi Autentikasi Server-Side
    let sessionUser: any = null;
    try {
      sessionUser = await getSessionUser();
    } catch {
      sessionUser = null;
    }

    const activeUserId = sessionUser?.id || sessionUser?.userId;
    if (!activeUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesi login tidak ditemukan. Silakan masuk terlebih dahulu sebelum memesan tiket.',
        },
        { status: 401 }
      );
    }

    // 2. Validasi Payload Request dengan Zod (Lapisan 2 Backend)
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Data pemesanan tidak valid.',
        },
        { status: 400 }
      );
    }

    const { jadwalId, kelas, penumpang } = parsed.data;

    // Pastikan tidak ada kursi duplikat dalam satu request
    const kursiIds = penumpang.map((p) => p.kursiId);
    if (new Set(kursiIds).size !== kursiIds.length) {
      return NextResponse.json(
        { success: false, error: 'Tidak boleh memilih kursi yang sama untuk dua penumpang.' },
        { status: 400 }
      );
    }

    // 3. Cek Jadwal & Hitung Harga Asli dari Tabel Tarif di Database
    const jadwal = await prisma.jadwal.findUnique({
      where: { id: jadwalId },
      include: {
        rute: {
          include: { tarif: true },
        },
      },
    });

    if (!jadwal) {
      return NextResponse.json(
        { success: false, error: 'Jadwal keberangkatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const tarifKelas = jadwal.rute.tarif.find((t) => t.kelas === kelas);
    if (!tarifKelas) {
      return NextResponse.json(
        { success: false, error: `Tarif untuk kelas ${kelas} pada rute ini tidak tersedia.` },
        { status: 400 }
      );
    }

    // Validasi bahwa kursi yang dipilih memang milik kereta & kelas pada jadwal tersebut
    const kursiRecords = await prisma.kursi.findMany({
      where: {
        id: { in: kursiIds },
        gerbong: {
          keretaId: jadwal.keretaId,
          kelas,
        },
      },
    });

    if (kursiRecords.length !== kursiIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Salah satu kursi tidak sesuai dengan kereta atau kelas yang dipilih.',
        },
        { status: 400 }
      );
    }

    const hargaSatuan = Number(tarifKelas.harga);
    const totalBayar = hargaSatuan * penumpang.length;
    const kodeBooking = `RLK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit batas bayar

    // 4. Simpan Secara Atomik via Transaksi PostgreSQL (Anti Race-Condition)
    const createdBooking = await prisma.$transaction(async (tx) => {
      // Cek ketersediaan kursi di dalam transaksi
      const bentrok = await tx.detailTiket.findFirst({
        where: {
          jadwalId,
          kursiId: { in: kursiIds },
          pemesanan: {
            statusPembayaran: {
              not: 'CANCELLED',
            },
          },
        },
        include: { kursi: true },
      });

      if (bentrok) {
        throw new Error(
          `CONFLICT:Kursi ${bentrok.kursi.nomorKursi} baru saja dipesan oleh penumpang lain.`
        );
      }

      return tx.pemesanan.create({
        data: {
          kodeBooking,
          userId: activeUserId,
          jadwalId,
          statusPembayaran: 'PENDING',
          totalBayar,
          expiredAt,
          detailTiket: {
            create: penumpang.map((p) => ({
              jadwalId,
              penumpangNama: p.nama.trim(),
              penumpangIdentitas: p.identitas.trim(),
              kursiId: p.kursiId,
              statusTiket: 'BOOKED',
            })),
          },
        },
        include: {
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
              kursi: { include: { gerbong: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pemesanan tiket berhasil disimpan ke database.',
        data: {
          ...createdBooking,
          totalBayar: Number(createdBooking.totalBayar),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message?.startsWith('CONFLICT:')) {
      return NextResponse.json(
        { success: false, error: error.message.replace('CONFLICT:', '') },
        { status: 409 }
      );
    }

    // Tangkap unique constraint violation PostgreSQL (idx_anti_double_booking)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Kursi yang dipilih sudah terpesan oleh pengguna lain.' },
        { status: 409 }
      );
    }

    console.error('Error POST /api/pemesanan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan pemesanan tiket.' },
      { status: 500 }
    );
  }
}