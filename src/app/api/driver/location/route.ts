import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

// POST /api/driver/location — Update driver GPS location
export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'driver') {
      return NextResponse.json({ error: 'Driver access only' }, { status: 403 });
    }

    const { latitude, longitude, heading, speed } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
    }

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
    console.error('[driver/location] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/driver/location?status=online — Set online/offline and get nearby rides
export async function PATCH(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'driver') {
      return NextResponse.json({ error: 'Driver access only' }, { status: 403 });
    }

    const { isOnline } = await req.json();

    await sql`
      UPDATE driver_profiles
      SET is_online = ${isOnline}, updated_at = NOW()
      WHERE user_id = ${payload.userId}
    `;

    // If going online, look for pending rides nearby
    if (isOnline) {
      const pendingRides = await sql`
        SELECT r.id, r.vehicle_type, r.pickup_address, r.dropoff_address,
               r.estimated_fare, r.pickup_lat, r.pickup_lng
        FROM rides r
        WHERE r.status = 'searching'
          AND r.vehicle_type = (SELECT vehicle_type FROM driver_profiles WHERE user_id = ${payload.userId})
        ORDER BY r.created_at ASC
        LIMIT 5
      `;
      return NextResponse.json({ success: true, pendingRides });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[driver/location PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
