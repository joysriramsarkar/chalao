import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import {
  normalizeVehicleType,
  isValidCoordinate,
  estimateDistanceKm,
  estimateDurationMin,
  calculateRideFare,
} from '@/lib/ride';
import { serverError, unauthorized } from '@/lib/api';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rides/quote — authoritative fare quote before booking.
 *
 * The rider app used to show a locally computed fare with a different tariff
 * card from the API. This endpoint lets the UI display exactly what the server
 * will charge, including the member rebate.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'rider');
    if (!payload) return unauthorized('Rider access only');

    const limit = rateLimit(`quote:${payload.userId}`, 60, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many quote requests' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const vehicleType = normalizeVehicleType(body?.vehicleType);

    if (!vehicleType) {
      return NextResponse.json({ error: 'Unsupported vehicle type' }, { status: 400 });
    }
    if (
      !isValidCoordinate(body?.pickupLat, body?.pickupLng) ||
      !isValidCoordinate(body?.dropoffLat, body?.dropoffLng)
    ) {
      return NextResponse.json({ error: 'Valid pickup and dropoff coordinates are required' }, { status: 400 });
    }

    const distanceKm = estimateDistanceKm(
      Number(body.pickupLat),
      Number(body.pickupLng),
      Number(body.dropoffLat),
      Number(body.dropoffLng)
    );
    const durationMin = estimateDurationMin(distanceKm);

    const riderRows = await sql`SELECT is_member FROM users WHERE id = ${payload.userId}`;
    const isMember = Boolean(riderRows[0]?.is_member);
    const fare = calculateRideFare(vehicleType, distanceKm, durationMin, isMember);

    return NextResponse.json({
      quote: {
        isMember,
        ...fare,
      },
    });
  } catch (error) {
    return serverError('rides/quote POST', error);
  }
}
