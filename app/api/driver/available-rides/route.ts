import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { normalizeVehicleType, VEHICLE_FARE_RATES } from '@/lib/ride';
import { rateLimit } from '@/lib/rateLimit';
import { serverError, unauthorized, forbidden } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/driver/available-rides
 *
 * Returns the oldest searching rides that match the driver's approved vehicle
 * type. The driver app polls this while online; previously a driver only saw a
 * ride at the exact moment they toggled online, so every later request was
 * invisible.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    const limit = rateLimit(`dispatch:${payload.userId}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many dispatch polls' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    await runMigrations();

    const profile = await sql`
      SELECT kyc_status, vehicle_type, is_online
      FROM driver_profiles
      WHERE user_id = ${payload.userId}
    `;

    if (!profile.length) {
      return NextResponse.json({ error: 'KYC profile not found' }, { status: 404 });
    }
    if (profile[0].kyc_status !== 'approved') {
      return forbidden('KYC approval required before receiving rides');
    }
    if (!profile[0].is_online) {
      return NextResponse.json({ rides: [] });
    }

    const vehicleType = normalizeVehicleType(profile[0].vehicle_type) || 'car';

    const rows = await sql`
      SELECT
        r.id,
        r.vehicle_type,
        r.pickup_address,
        r.dropoff_address,
        r.pickup_lat,
        r.pickup_lng,
        r.dropoff_lat,
        r.dropoff_lng,
        r.estimated_fare,
        r.distance_km,
        r.duration_mins,
        r.payment_method,
        r.created_at,
        CASE WHEN dl.latitude IS NULL THEN NULL ELSE
          6371 * ACOS(LEAST(1.0,
            COS(RADIANS(dl.latitude)) * COS(RADIANS(r.pickup_lat)) *
            COS(RADIANS(r.pickup_lng) - RADIANS(dl.longitude)) +
            SIN(RADIANS(dl.latitude)) * SIN(RADIANS(r.pickup_lat))
          ))
        END AS pickup_distance_km
      FROM rides r
      LEFT JOIN driver_locations dl ON dl.driver_id = ${payload.userId}
      WHERE r.status = 'searching'
        AND r.vehicle_type = ${vehicleType}
        AND r.created_at > NOW() - INTERVAL '20 minutes'
      ORDER BY pickup_distance_km NULLS LAST, r.created_at ASC
      LIMIT 5
    `;

    const rate = VEHICLE_FARE_RATES[vehicleType];

    return NextResponse.json({
      rides: rows.map((ride: any) => {
        const gross = Number(ride.estimated_fare) || 0;
        const platformFee = Math.round(gross * rate.commissionRate);
        return {
          id: ride.id,
          vehicle_type: ride.vehicle_type,
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          pickup_lat: Number(ride.pickup_lat),
          pickup_lng: Number(ride.pickup_lng),
          dropoff_lat: Number(ride.dropoff_lat),
          dropoff_lng: Number(ride.dropoff_lng),
          estimated_fare: gross,
          driver_earnings: gross - platformFee,
          platform_fee: platformFee,
          distance_km: ride.distance_km === null ? null : Number(ride.distance_km),
          duration_mins: ride.duration_mins,
          payment_method: ride.payment_method,
          pickup_distance_km:
            ride.pickup_distance_km === null
              ? null
              : Math.round(Number(ride.pickup_distance_km) * 10) / 10,
          created_at: ride.created_at,
        };
      }),
    });
  } catch (error) {
    return serverError('driver/available-rides GET', error);
  }
}
