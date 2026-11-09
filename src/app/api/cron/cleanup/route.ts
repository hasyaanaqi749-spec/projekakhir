import { NextRequest, NextResponse } from 'next/server';
import { runCancelExpiredBookings } from '@/workers/expiredBookingWorker';

export async function GET(req: NextRequest) {
  // Baca headers otorisasi di luar try-catch
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized cron trigger' },
      { status: 401 }
    );
  }

  try {
    const result = await runCancelExpiredBookings();

    return NextResponse.json({
      success: true,
      message: 'Worker cron pembersihan tiket kedaluwarsa berhasil dieksekusi.',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
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