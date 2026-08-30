import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

// GET /api/driver/earnings — Driver earnings history and summary
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'driver') {
      return NextResponse.json({ error: 'Driver access only' }, { status: 403 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'today';

    let dateFilter;
    switch (period) {
      case 'today':
        dateFilter = sql`AND e.created_at >= NOW() - INTERVAL '1 day'`;
        break;
      case 'week':
        dateFilter = sql`AND e.created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = sql`AND e.created_at >= NOW() - INTERVAL '30 days'`;
        break;
      default:
        dateFilter = sql``;
    }

    const earnings = await sql`
      SELECT e.*,
             r.pickup_address, r.dropoff_address, r.completed_at as ride_completed_at,
             r.distance_km, r.payment_method
      FROM earnings e
      LEFT JOIN rides r ON r.id = e.ride_id
      WHERE e.driver_id = ${payload.userId}
      ORDER BY e.created_at DESC
      LIMIT 50
    `;

    // Summary
    const summary = await sql`
      SELECT 
        COUNT(*) as total_rides,
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(commission_amt), 0) as total_commission,
        COALESCE(SUM(net_amount), 0) as total_net,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN net_amount ELSE 0 END), 0) as pending_payout
      FROM earnings
      WHERE driver_id = ${payload.userId}
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    // Today's summary
    const todaySummary = await sql`
      SELECT 
        COUNT(*) as rides_today,
        COALESCE(SUM(net_amount), 0) as earned_today
      FROM earnings
      WHERE driver_id = ${payload.userId}
        AND created_at >= CURRENT_DATE
    `;

    return NextResponse.json({ 
      earnings,
      summary: summary[0],
      today: todaySummary[0],
    });
  } catch (error) {
    console.error('[driver/earnings GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/driver/earnings — Request UPI payout
export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'driver') {
      return NextResponse.json({ error: 'Driver access only' }, { status: 403 });
    }

    const { upiId } = await req.json();

    // Get pending earnings
    const pending = await sql`
      SELECT id, net_amount FROM earnings
      WHERE driver_id = ${payload.userId} AND payout_status = 'pending'
    `;

    if (!pending.length) {
      return NextResponse.json({ error: 'No pending earnings to payout' }, { status: 400 });
    }

    const totalPayout = pending.reduce((sum: number, e: any) => sum + parseFloat(e.net_amount), 0);
    const ids = pending.map((e: any) => e.id);

    // Mark as paid (in production, integrate with payment gateway)
    await sql`
      UPDATE earnings
      SET payout_status = 'paid',
          payout_upi = ${upiId},
          payout_at = NOW()
      WHERE id = ANY(${ids})
    `;

    return NextResponse.json({
      success: true,
      message: `₹${totalPayout.toFixed(2)} payout initiated to ${upiId}`,
      amount: totalPayout,
    });
  } catch (error) {
    console.error('[driver/earnings POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
