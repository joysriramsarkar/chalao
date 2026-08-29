import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';

export const revalidate = 0;


// GET /api/admin/stats — Return real-time platform statistics from Neon DB
export async function GET(req: NextRequest) {
  try {
    await runMigrations();

    const [
      driverCounts,
      rideCounts,
      earningsCounts,
    ] = await Promise.all([
      sql`
        SELECT 
          COUNT(*)::int AS total_drivers,
          COUNT(CASE WHEN dp.kyc_status = 'approved' THEN 1 END)::int AS approved_drivers,
          COUNT(CASE WHEN dp.kyc_status IN ('pending', 'in_review') OR dp.kyc_status IS NULL THEN 1 END)::int AS pending_kyc,
          COUNT(CASE WHEN dp.is_online = true THEN 1 END)::int AS online_drivers
        FROM users u
        LEFT JOIN driver_profiles dp ON dp.user_id = u.id
        WHERE u.role = 'driver'
      `,
      sql`
        SELECT 
          COUNT(*)::int AS total_rides,
          COUNT(CASE WHEN status = 'ongoing' THEN 1 END)::int AS active_rides,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_rides,
          COALESCE(SUM(final_fare), 0)::numeric AS total_gmv
        FROM rides
      `,
      sql`
        SELECT 
          COALESCE(SUM(commission_amt), 0)::numeric AS total_commission,
          COALESCE(SUM(net_amount), 0)::numeric AS total_payouts
        FROM earnings
      `
    ]);

    const d = driverCounts[0] || {};
    const r = rideCounts[0] || {};
    const e = earningsCounts[0] || {};

    return NextResponse.json({
      success: true,
      stats: {
        totalDrivers: d.total_drivers || 0,
        approvedDrivers: d.approved_drivers || 0,
        pendingKyc: d.pending_kyc || 0,
        onlineDrivers: d.online_drivers || 0,
        totalRides: r.total_rides || 0,
        activeRides: r.active_rides || 0,
        completedRides: r.completed_rides || 0,
        totalGmv: Number(r.total_gmv || 0),
        totalCommission: Number(e.total_commission || 0),
        totalPayouts: Number(e.total_payouts || 0),
      }
    });
  } catch (error) {
    console.error('[admin/stats GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
