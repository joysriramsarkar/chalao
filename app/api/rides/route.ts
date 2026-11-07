import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import {
  normalizeVehicleType,
  isValidCoordinate,
  estimateDistanceKm,
  estimateDurationMin,
  calculateRideFare,
} from '@/lib/ride';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

const PAYMENT_METHODS = ['cash', 'upi', 'wallet', 'card'] as const;

function generateOtpPin(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (1000 + (bytes[0] % 9000)).toString();
}

// POST /api/rides — Create a new ride request
export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'rider');
    if (!payload) return unauthorized('Only authenticated riders can request rides');

    const limit = rateLimit(`rides:create:${payload.userId}`, 8, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'অনেকবার রাইড অনুরোধ করা হয়েছে। এক মিনিট পরে আবার চেষ্টা করুন।' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    await runMigrations();

    const body = await req.json().catch(() => ({}));
    const {
      vehicleType,
      pickupLat,
      pickupLng,
      pickupAddress,
      dropoffLat,
      dropoffLng,
      dropoffAddress,
      paymentMethod,
    } = body;

    const canonicalVehicle = normalizeVehicleType(vehicleType);
    if (!canonicalVehicle) {
      return NextResponse.json({ error: 'Unsupported vehicle type' }, { status: 400 });
    }

    if (!isValidCoordinate(pickupLat, pickupLng) || !isValidCoordinate(dropoffLat, dropoffLng)) {
      return NextResponse.json({ error: 'Valid pickup and dropoff coordinates are required' }, { status: 400 });
    }

    const method = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'cash';

    // Distance and fare are computed on the server from coordinates. The client
    // value is ignored so a tampered request cannot choose its own price.
    const distance = estimateDistanceKm(
      Number(pickupLat),
      Number(pickupLng),
      Number(dropoffLat),
      Number(dropoffLng)
    );
    const duration = estimateDurationMin(distance);

    const riderRows = await sql`SELECT is_member FROM users WHERE id = ${payload.userId}`;
    const isMember = Boolean(riderRows[0]?.is_member);
    const fare = calculateRideFare(canonicalVehicle, distance, duration, isMember);

    // Reject a second active ride for the same rider.
    const active = await sql`
      SELECT id FROM rides
      WHERE rider_id = ${payload.userId}
        AND status IN ('searching', 'accepted', 'arrived', 'ongoing')
      LIMIT 1
    `;
    if (active.length) {
      return NextResponse.json(
        { error: 'আপনার একটি সক্রিয় রাইড ইতিমধ্যে চলছে।', rideId: active[0].id },
        { status: 409 }
      );
    }

    const riderOtpPin = generateOtpPin();

    const result = await sql`
      INSERT INTO rides (
        rider_id, vehicle_type, status,
        pickup_lat, pickup_lng, pickup_address,
        dropoff_lat, dropoff_lng, dropoff_address,
        estimated_fare, distance_km, duration_mins, payment_method, rider_otp_pin
      ) VALUES (
        ${payload.userId}, ${canonicalVehicle}, 'searching',
        ${Number(pickupLat)}, ${Number(pickupLng)}, ${String(pickupAddress || 'Pickup location').slice(0, 500)},
        ${Number(dropoffLat)}, ${Number(dropoffLng)}, ${String(dropoffAddress || 'Dropoff location').slice(0, 500)},
        ${fare.grossFare}, ${distance}, ${duration}, ${method}, ${riderOtpPin}
      )
      RETURNING *
    `;

    const ride = result[0];

    return NextResponse.json({
      ride: {
        id: ride.id,
        status: ride.status,
        vehicleType: canonicalVehicle,
        pickupAddress: ride.pickup_address,
        dropoffAddress: ride.dropoff_address,
        estimatedFare: Number(ride.estimated_fare),
        riderPayable: fare.riderPayable,
        driverEarnings: fare.driverNet,
        platformFee: fare.platformFee,
        memberRebate: fare.memberRebate,
        distanceKm: Number(ride.distance_km),
        durationMin: ride.duration_mins,
        paymentMethod: ride.payment_method,
        riderOtpPin: ride.rider_otp_pin,
        createdAt: ride.created_at,
      },
    });
  } catch (error) {
    return serverError('rides POST', error);
  }
}

// GET /api/rides — Ride history for the signed-in user
export async function GET(req: NextRequest) {
  try {
    const token = await requireAuth(req);
    if (!token) return unauthorized();

    await runMigrations();

    const url = new URL(req.url);
    const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
    const parsedOffset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Math.min(100, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 20));
    const offset = Math.max(0, Number.isFinite(parsedOffset) ? parsedOffset : 0);

    let rides;
    if (token.role === 'rider') {
      rides = await sql`
        SELECT r.*,
               u.name as driver_name, u.phone as driver_phone,
               dp.vehicle_make, dp.vehicle_model, dp.vehicle_color, dp.rating as driver_rating
        FROM rides r
        LEFT JOIN users u ON u.id = r.driver_id
        LEFT JOIN driver_profiles dp ON dp.user_id = r.driver_id
        WHERE r.rider_id = ${token.userId}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (token.role === 'driver') {
      rides = await sql`
        SELECT r.*,
               u.name as rider_name, u.phone as rider_phone
        FROM rides r
        LEFT JOIN users u ON u.id = r.rider_id
        WHERE r.driver_id = ${token.userId}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      // The driver must not be able to read the rider's pickup PIN in advance.
      rides = rides.map((ride: any) => ({ ...ride, rider_otp_pin: null }));
    } else {
      rides = await sql`
        SELECT r.*,
               ur.name as rider_name,
               ud.name as driver_name
        FROM rides r
        LEFT JOIN users ur ON ur.id = r.rider_id
        LEFT JOIN users ud ON ud.id = r.driver_id
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return NextResponse.json({ rides });
  } catch (error) {
    return serverError('rides GET', error);
  }
}
