import { NextResponse } from 'next/server';
import { runCancelExpiredBookings } from '@/workers/expiredBookingWorker';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized cron trigger' },
        { status: 401 }
      );
    }

    const result = await runCancelExpiredBookings();

    return NextResponse.json({
      success: true,
      message: 'Worker cron pembersihan tiket kedaluwarsa berhasil dieksekusi.',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    // Teruskan sinyal internal Next.js agar prerendering beralih ke dynamic secara mulus
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }

    console.error('Error executing cron cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal menjalankan cron cleanup.',
      },
      { status: 500 }
    );
  }
}