import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { isValidUpiId } from '@/lib/ride';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

const PERIODS = ['today', 'week', 'month', 'all'] as const;
type Period = (typeof PERIODS)[number];

function periodStart(period: Period): string {
  const now = new Date();
  if (period === 'week') {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (period === 'month') {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  return new Date(0).toISOString();
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

// GET /api/driver/earnings — Driver earnings history and summary
export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    await runMigrations();

    const url = new URL(req.url);
    const requested = url.searchParams.get('period') as Period | null;
    const period: Period = requested && PERIODS.includes(requested) ? requested : 'today';
    const since = periodStart(period);

    const earnings = await sql`
      SELECT e.*,
             r.pickup_address, r.dropoff_address, r.completed_at as ride_completed_at,
             r.distance_km, r.payment_method
      FROM earnings e
      LEFT JOIN rides r ON r.id = e.ride_id
      WHERE e.driver_id = ${payload.userId}
        AND e.created_at >= ${since}
      ORDER BY e.created_at DESC
      LIMIT 100
    `;

    const summary = await sql`
      SELECT
        COUNT(*)::int as total_rides,
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(commission_amt), 0) as total_commission,
        COALESCE(SUM(net_amount), 0) as total_net,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN net_amount ELSE 0 END), 0) as pending_payout
      FROM earnings
      WHERE driver_id = ${payload.userId}
        AND created_at >= ${since}
    `;

    const todaySummary = await sql`
      SELECT
        COUNT(*)::int as rides_today,
        COALESCE(SUM(net_amount), 0) as earned_today
      FROM earnings
      WHERE driver_id = ${payload.userId}
        AND created_at >= CURRENT_DATE
    `;

    return NextResponse.json({
      period,
      earnings: earnings.map((row: any) => ({
        ...row,
        gross_amount: num(row.gross_amount),
        commission_pct: num(row.commission_pct),
        commission_amt: num(row.commission_amt),
        net_amount: num(row.net_amount),
        distance_km: row.distance_km === null ? null : num(row.distance_km),
      })),
      summary: {
        total_rides: Number(summary[0]?.total_rides || 0),
        total_gross: num(summary[0]?.total_gross),
        total_commission: num(summary[0]?.total_commission),
        total_net: num(summary[0]?.total_net),
        pending_payout: num(summary[0]?.pending_payout),
      },
      today: {
        rides_today: Number(todaySummary[0]?.rides_today || 0),
        earned_today: num(todaySummary[0]?.earned_today),
      },
    });
  } catch (error) {
    return serverError('driver/earnings GET', error);
  }
}

// POST /api/driver/earnings — Request a UPI payout of all pending earnings
export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    await runMigrations();

    const body = await req.json().catch(() => ({}));
    const requestedUpi = typeof body?.upiId === 'string' ? body.upiId.trim() : '';
    const requestedAmount = body?.amount === undefined ? null : Number(body.amount);

    if (requestedUpi && !isValidUpiId(requestedUpi)) {
      return NextResponse.json({ error: 'UPI আইডির ফরম্যাট সঠিক নয়।' }, { status: 400 });
    }

    const profile = await sql`SELECT upi_id FROM driver_profiles WHERE user_id = ${payload.userId}`;
    const upiId = requestedUpi || profile[0]?.upi_id || '';
    if (!isValidUpiId(upiId)) {
      return NextResponse.json(
        { error: 'পেআউটের জন্য প্রথমে একটি বৈধ UPI আইডি যোগ করুন।' },
        { status: 400 }
      );
    }

    const pending = await sql`
      SELECT COALESCE(SUM(net_amount), 0) AS total, COUNT(*)::int AS count
      FROM earnings
      WHERE driver_id = ${payload.userId} AND payout_status = 'pending'
    `;

    const total = num(pending[0]?.total);
    const count = Number(pending[0]?.count || 0);

    if (!count || total <= 0) {
      return NextResponse.json({ error: 'No pending earnings to payout' }, { status: 400 });
    }

    // The API pays out the full pending balance. A mismatched partial amount
    // used to be silently ignored; now it is rejected with the real figure.
    if (requestedAmount !== null && Number.isFinite(requestedAmount) && Math.abs(requestedAmount - total) > 0.01) {
      return NextResponse.json(
        {
          error: `সম্পূর্ণ ব্যালেন্স ₹${total.toFixed(2)} পেআউট করা হয়।`,
          pendingAmount: total,
        },
        { status: 400 }
      );
    }

    const paid = await sql`
      WITH picked AS (
        SELECT id FROM earnings
        WHERE driver_id = ${payload.userId} AND payout_status = 'pending'
        ORDER BY created_at ASC
      ), updated AS (
        UPDATE earnings e
        SET payout_status = 'paid',
            payout_upi = ${upiId},
            payout_at = NOW()
        FROM picked
        WHERE e.id = picked.id AND e.payout_status = 'pending'
        RETURNING e.net_amount
      )
      SELECT COALESCE(SUM(net_amount), 0) AS amount, COUNT(*)::int AS count FROM updated
    `;

    const amount = num(paid[0]?.amount);
    if (!Number(paid[0]?.count || 0)) {
      return NextResponse.json({ error: 'Payout already processed' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: `₹${amount.toFixed(2)} payout initiated to ${upiId}`,
      amount,
      rides: Number(paid[0]?.count || 0),
      upiId,
    });
  } catch (error) {
    return serverError('driver/earnings POST', error);
  }
}
