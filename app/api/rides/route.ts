import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

// Fare calculation (transparent co-op model)
function calculateFare(vehicleType: string, distanceKm: number): number {
  const rates: Record<string, { base: number; perKm: number }> = {
    bike:  { base: 15, perKm: 8 },
    auto:  { base: 25, perKm: 12 },
    sedan: { base: 40, perKm: 16 },
    suv:   { base: 60, perKm: 22 },
    ev:    { base: 35, perKm: 14 },
    pink:  { base: 40, perKm: 16 },
  };
  const rate = rates[vehicleType] || rates.sedan;
  return Math.ceil(rate.base + rate.perKm * distanceKm);
}

function generateOtpPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST /api/rides — Create a new ride request
export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'rider') {
      return NextResponse.json({ error: 'Only riders can request rides' }, { status: 403 });
    }

    const { vehicleType, pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, paymentMethod, distanceKm } = await req.json();

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json({ error: 'Pickup and dropoff coordinates are required' }, { status: 400 });
    }

    const distance = distanceKm || 5; // fallback
    const estimatedFare = calculateFare(vehicleType || 'sedan', distance);
    const riderOtpPin = generateOtpPin();

    const result = await sql`
      INSERT INTO rides (
        rider_id, vehicle_type, status,
        pickup_lat, pickup_lng, pickup_address,
        dropoff_lat, dropoff_lng, dropoff_address,
        estimated_fare, distance_km, payment_method, rider_otp_pin
      ) VALUES (
        ${payload.userId}, ${vehicleType || 'sedan'}, 'searching',
        ${pickupLat}, ${pickupLng}, ${pickupAddress || 'Pickup location'},
        ${dropoffLat}, ${dropoffLng}, ${dropoffAddress || 'Dropoff location'},
        ${estimatedFare}, ${distance}, ${paymentMethod || 'cash'}, ${riderOtpPin}
      )
      RETURNING *
    `;

    const ride = result[0];

    return NextResponse.json({
      ride: {
        id: ride.id,
        status: ride.status,
        vehicleType: ride.vehicle_type,
        pickupAddress: ride.pickup_address,
        dropoffAddress: ride.dropoff_address,
        estimatedFare: ride.estimated_fare,
        distanceKm: ride.distance_km,
        paymentMethod: ride.payment_method,
        riderOtpPin: ride.rider_otp_pin, // shown to rider
        createdAt: ride.created_at,
      },
    });
  } catch (error) {
    console.error('[rides POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/rides — Get user's ride history
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let rides;
    if (payload.role === 'rider') {
      rides = await sql`
        SELECT r.*, 
               u.name as driver_name, u.phone as driver_phone,
               dp.vehicle_make, dp.vehicle_model, dp.vehicle_color, dp.rating as driver_rating
        FROM rides r
        LEFT JOIN users u ON u.id = r.driver_id
        LEFT JOIN driver_profiles dp ON dp.user_id = r.driver_id
        WHERE r.rider_id = ${payload.userId}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (payload.role === 'driver') {
      rides = await sql`
        SELECT r.*,
               u.name as rider_name, u.phone as rider_phone
        FROM rides r
        LEFT JOIN users u ON u.id = r.rider_id
        WHERE r.driver_id = ${payload.userId}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // admin
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
    console.error('[rides GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
