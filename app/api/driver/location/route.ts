import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { isValidCoordinate, normalizeVehicleType } from '@/lib/ride';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST /api/driver/location — Update driver GPS location
export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    await runMigrations();

    const body = await req.json().catch(() => ({}));
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    if (!isValidCoordinate(latitude, longitude)) {
      return NextResponse.json({ error: 'Valid latitude and longitude are required' }, { status: 400 });
    }

    const headingRaw = Number(body?.heading);
    const speedRaw = Number(body?.speed);
    const heading = Number.isFinite(headingRaw) ? Math.min(360, Math.max(0, headingRaw)) : null;
    const speed = Number.isFinite(speedRaw) && speedRaw >= 0 ? Math.min(300, speedRaw) : null;

    await sql`
      INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed, updated_at)
      VALUES (${payload.userId}, ${latitude}, ${longitude}, ${heading}, ${speed}, NOW())
      ON CONFLICT (driver_id) DO UPDATE
        SET latitude = ${latitude},
            longitude = ${longitude},
            heading = COALESCE(${heading}, driver_locations.heading),
            speed = COALESCE(${speed}, driver_locations.speed),
            updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('driver/location POST', error);
  }
}

// PATCH /api/driver/location — Toggle online status and list nearby requests
export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    await runMigrations();

    const body = await req.json().catch(() => ({}));
    if (typeof body?.isOnline !== 'boolean') {
      return NextResponse.json({ error: 'isOnline must be a boolean' }, { status: 400 });
    }
    const isOnline = body.isOnline;

    const profile = await sql`
      SELECT kyc_status, vehicle_type FROM driver_profiles WHERE user_id = ${payload.userId}
    `;
    if (!profile.length) {
      return NextResponse.json({ error: 'KYC profile not found. Complete onboarding first.' }, { status: 404 });
    }
    if (profile[0].kyc_status === 'rejected') {
      return NextResponse.json({ error: 'KYC rejected. Contact support before going online.' }, { status: 403 });
    }

    await sql`
      UPDATE driver_profiles
      SET is_online = ${isOnline}, updated_at = NOW()
      WHERE user_id = ${payload.userId}
    `;

    if (!isOnline) {
      return NextResponse.json({ success: true, pendingRides: [] });
    }

    const vehicleType = normalizeVehicleType(profile[0].vehicle_type) || 'car';
    const pendingRides = await sql`
      SELECT r.id, r.vehicle_type, r.pickup_address, r.dropoff_address,
             r.estimated_fare, r.pickup_lat, r.pickup_lng, r.distance_km, r.created_at
      FROM rides r
      WHERE r.status = 'searching'
        AND r.vehicle_type = ${vehicleType}
      ORDER BY r.created_at ASC
      LIMIT 5
    `;

    return NextResponse.json({ success: true, pendingRides });
  } catch (error) {
    return serverError('driver/location PATCH', error);
  }
}
