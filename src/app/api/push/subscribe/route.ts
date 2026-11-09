import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { success: false, error: 'Payload PushSubscription tidak lengkap.' },
        { status: 400 }
      );
    }

    // Ambil user login jika ada sesi
    let activeUserId: string | null = null;
    try {
      const user = await getSessionUser();
      if (user && user.id) {
        activeUserId = user.id;
      }
    } catch {
      // Abaikan jika pemanggilan auth gagal
    }

    // Jika user belum login, gunakan fallback user pertama di database agar userId tidak kosong
    if (!activeUserId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        activeUserId = defaultUser.id;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Silakan login terlebih dahulu untuk mengaktifkan notifikasi.',
          },
          { status: 401 }
        );
      }
    }

    // Cari apakah endpoint ini sudah pernah didaftarkan
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: { endpoint },
    });

    let subscription;

    if (existingSubscription) {
      // Update menggunakan properti keysP256dh dan keysAuth sesuai schema.prisma
      subscription = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          keysP256dh: keys.p256dh,
          keysAuth: keys.auth,
          userId: activeUserId,
        },
      });
    } else {
      // Create menggunakan properti keysP256dh dan keysAuth sesuai schema.prisma
      subscription = await prisma.pushSubscription.create({
        data: {
          endpoint,
          keysP256dh: keys.p256dh,
          keysAuth: keys.auth,
          userId: activeUserId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification berhasil didaftarkan ke server.',
      subscriptionId: subscription.id,
    });
  } catch (err: any) {
    console.error('Error POST /api/push/subscribe:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal menyimpan subscription push ke database.',
      },
      { status: 500 }
    );
  }
}