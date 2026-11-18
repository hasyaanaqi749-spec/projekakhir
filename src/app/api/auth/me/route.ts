import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !UUID_REGEX.test(session.id)) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
    });
  } catch (error) {
    console.error('Error GET /api/auth/me:', error);
    return NextResponse.json(
      { success: false, user: null },
      { status: 500 }
    );
  }
}