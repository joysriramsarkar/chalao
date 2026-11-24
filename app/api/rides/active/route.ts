import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { serverError, unauthorized } from '@/lib/api';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rides/active — the caller's current ride, if any.
 *
 * Used on app launch so a rider or driver does not lose an in-progress trip
 * when the process is killed. Drivers never receive the rider's pickup PIN.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized();

    const limit = rateLimit(`active-ride:${payload.userId}`, 60, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (payload.role === 'admin') {
      return NextResponse.json({ ride: null });
    }

    await runMigrations();

    let rows;

    if (payload.role === 'rider') {
      rows = await sql`
        SELECT r.*,
               ud.name AS driver_name, ud.phone AS driver_phone,
               dp.vehicle_make, dp.vehicle_model, dp.vehicle_color, dp.vehicle_type,
               dp.rating AS driver_rating,
               dl.latitude AS driver_lat, dl.longitude AS driver_lng, dl.heading AS driver_heading
        FROM rides r
        LEFT JOIN users ud ON ud.id = r.driver_id
        LEFT JOIN driver_profiles dp ON dp.user_id = r.driver_id
        LEFT JOIN driver_locations dl ON dl.driver_id = r.driver_id
        WHERE r.rider_id = ${payload.userId}
          AND r.status IN ('searching', 'accepted', 'arrived', 'ongoing')
        ORDER BY r.created_at DESC
        LIMIT 1
      `;
    } else {
      rows = await sql`
        SELECT r.*,
               ur.name AS rider_name, ur.phone AS rider_phone, ur.avatar_url AS rider_avatar
        FROM rides r
        LEFT JOIN users ur ON ur.id = r.rider_id
        WHERE r.driver_id = ${payload.userId}
          AND r.status IN ('searching', 'accepted', 'arrived', 'ongoing')
        ORDER BY r.created_at DESC
        LIMIT 1
      `;
      if (rows.length) rows[0].rider_otp_pin = null;
    }

    return NextResponse.json({ ride: rows[0] || null });
  } catch (error) {
    return serverError('rides/active GET', error);
  }
}
