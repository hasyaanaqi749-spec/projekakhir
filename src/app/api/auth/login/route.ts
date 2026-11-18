import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie, verifyPassword } from '@/lib/auth';

const DEMO_SEED_USERS: Record<
  string,
  { nama: string; role: UserRole; demoPasswords: string[]; phone: string }
> = {
  'admin@kai.id': {
    nama: 'Administrator KAI Pusat',
    role: 'ADMIN',
    demoPasswords: ['admin123', 'password123'],
    phone: '081110000001',
  },
  'petugas.gmr@kai.id': {
    nama: 'Petugas Stasiun Gambir',
    role: 'PETUGAS',
    demoPasswords: ['petugas123', 'password123'],
    phone: '081110000002',
  },
  'petugas@kai.id': {
    nama: 'Petugas Stasiun KAI',
    role: 'PETUGAS',
    demoPasswords: ['petugas123', 'password123'],
    phone: '081110000003',
  },
  'budi@gmail.com': {
    nama: 'Budi Santoso',
    role: 'PENUMPANG',
    demoPasswords: ['budi123', 'password123'],
    phone: '081234567890',
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    let dbUser = await prisma.user.findUnique({
      where: { email },
    });

    const demoMeta = DEMO_SEED_USERS[email];
    const isDemoShortcutPassword =
      Boolean(demoMeta) && demoMeta.demoPasswords.includes(password);

    // Jika akun demo belum ada di DB dan pakai password demo, buat di Supabase
    if (!dbUser && demoMeta && isDemoShortcutPassword) {
      dbUser = await prisma.user.create({
        data: {
          nama: demoMeta.nama,
          email,
          passwordHash: await hashPassword(password),
          role: demoMeta.role,
          phone: demoMeta.phone,
        },
      });
    }

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    const isHashMatch = await verifyPassword(password, dbUser.passwordHash);
    if (!isHashMatch && !isDemoShortcutPassword) {
      return NextResponse.json(
        { success: false, error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: dbUser.id,
      email: dbUser.email,
      nama: dbUser.nama,
      role: dbUser.role,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: sessionPayload,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kendala saat memproses login.' },
      { status: 500 }
    );
  }
}