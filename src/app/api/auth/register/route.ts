import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';

const registerSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter.')
    .max(150, 'Nama maksimal 150 karakter.'),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid.')
    .max(150),
  phone: z
    .string()
    .trim()
    .min(10, 'Nomor telepon / WhatsApp minimal 10 digit.')
    .max(20, 'Nomor telepon maksimal 20 digit.'),
  password: z
    .string()
    .min(6, 'Kata sandi minimal 6 karakter.')
    .max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Data pendaftaran tidak valid.',
        },
        { status: 400 }
      );
    }

    const emailNormalized = parsed.data.email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email sudah terdaftar. Silakan masuk menggunakan akun Anda.',
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    // Role dipaksa menjadi PENUMPANG di sisi server (keamanan RBAC)
    const createdUser = await prisma.user.create({
      data: {
        nama: parsed.data.nama,
        email: emailNormalized,
        phone: parsed.data.phone,
        passwordHash,
        role: 'PENUMPANG',
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
      },
    });

    await setSessionCookie(createdUser);

    return NextResponse.json(
      {
        success: true,
        message: 'Pendaftaran berhasil.',
        user: createdUser,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses pendaftaran akun.' },
      { status: 500 }
    );
  }
}