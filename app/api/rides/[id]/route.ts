import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canTransition, isFareWithinTolerance, normalizeVehicleType, VEHICLE_FARE_RATES } from '@/lib/ride';
import { serverError, unauthorized, forbidden } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

// GET /api/rides/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized();

    const rideId = Number.parseInt(params.id, 10);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return NextResponse.json({ error: 'Invalid ride ID' }, { status: 400 });
    }

    await runMigrations();

    const result = await sql`
      SELECT r.*,
             ur.name as rider_name, ur.phone as rider_phone, ur.avatar_url as rider_avatar,
             ud.name as driver_name, ud.phone as driver_phone,
             dp.vehicle_make, dp.vehicle_model, dp.vehicle_color, dp.vehicle_type,
             dp.rating as driver_rating, dp.total_rides as driver_total_rides,
             dl.latitude as driver_lat, dl.longitude as driver_lng, dl.heading as driver_heading
      FROM rides r
      LEFT JOIN users ur ON ur.id = r.rider_id
      LEFT JOIN users ud ON ud.id = r.driver_id
      LEFT JOIN driver_profiles dp ON dp.user_id = r.driver_id
      LEFT JOIN driver_locations dl ON dl.driver_id = r.driver_id
      WHERE r.id = ${rideId}
    `;

    if (!result.length) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    const ride = result[0];

    if (payload.role === 'rider' && ride.rider_id !== payload.userId) {
      return forbidden();
    }
    if (payload.role === 'driver' && ride.driver_id !== payload.userId) {
      return forbidden();
    }

    // Never hand the pickup PIN to the driver through the read API; the rider
    // shares it verbally and the server verifies it on the status transition.
    if (payload.role === 'driver') {
      ride.rider_otp_pin = null;
    }

    return NextResponse.json({ ride });
  } catch (error) {
    return serverError('rides/[id] GET', error);
  }
}

// PATCH /api/rides/[id] — Update ride status, ratings or cancellation
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized();

    const rideId = Number.parseInt(params.id, 10);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return NextResponse.json({ error: 'Invalid ride ID' }, { status: 400 });
    }

    await runMigrations();

    const body = await req.json().catch(() => ({}));
    const { status, riderRating, riderReview, driverRating, driverReview, cancelReason, finalFare, otpPin } = body;

    const rideResult = await sql`SELECT * FROM rides WHERE id = ${rideId}`;
    if (!rideResult.length) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    const ride = rideResult[0];

    const actor = payload.role as 'rider' | 'driver' | 'admin';
    if (!['rider', 'driver', 'admin'].includes(actor)) {
      return forbidden('Unknown role');
    }

    // Ownership checks. A driver may only touch an unassigned ride in order to
    // accept it; every other action requires the driver already assigned.
    if (actor === 'rider' && ride.rider_id !== payload.userId) {
      return forbidden('This ride belongs to another rider');
    }
    if (actor === 'driver') {
      const accepting = status === 'accepted' && ride.driver_id === null;
      if (!accepting && ride.driver_id !== payload.userId) {
        return forbidden('This ride is assigned to another driver');
      }
    }

    const ratingValue = (value: unknown): number | null => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
    };

    // ── Rating-only update (no status change) ────────────────────────────
    if (!status) {
      if (ride.status !== 'completed') {
        return NextResponse.json({ error: 'Ratings can only be added after the ride is completed' }, { status: 400 });
      }

      const driverRatingValue = actor === 'rider' ? ratingValue(driverRating) : null;
      const riderRatingValue = actor === 'driver' ? ratingValue(riderRating) : null;
      if (
        driverRatingValue === null &&
        riderRatingValue === null &&
        riderReview == null &&
        driverReview == null
      ) {
        return NextResponse.json({ error: 'No rating or review supplied' }, { status: 400 });
      }

      await sql`
        UPDATE rides
        SET rider_rating = COALESCE(${riderRatingValue}, rider_rating),
            rider_review = COALESCE(${typeof riderReview === 'string' ? riderReview.slice(0, 1000) : null}, rider_review),
            driver_rating = COALESCE(${driverRatingValue}, driver_rating),
            driver_review = COALESCE(${typeof driverReview === 'string' ? driverReview.slice(0, 1000) : null}, driver_review),
            updated_at = NOW()
        WHERE id = ${rideId}
      `;

      if (driverRatingValue !== null && ride.driver_id) {
        await sql`
          UPDATE driver_profiles
          SET rating = ROUND(((rating * total_rides) + ${driverRatingValue}) / (total_rides + 1), 2),
              updated_at = NOW()
          WHERE user_id = ${ride.driver_id}
        `;
      }

      return NextResponse.json({ success: true, rideId, ratingSaved: true });
    }

    // ── Status transition validation ─────────────────────────────────────
    if (!canTransition(ride.status, status, actor)) {
      return NextResponse.json(
        { error: `Cannot change ride from '${ride.status}' to '${status}' as ${actor}` },
        { status: 409 }
      );
    }

    if (status === 'accepted') {
      if (actor !== 'driver') {
        // Admin tokens have no driver row; assigning userId 0 would violate
        // the rides.driver_id foreign key.
        return forbidden('Only a driver can accept a ride');
      }

      // Atomic claim: two drivers accepting the same ride can no longer both
      // receive a success response.
      const claimed = await sql`
        UPDATE rides
        SET status = 'accepted', driver_id = ${payload.userId}, updated_at = NOW()
        WHERE id = ${rideId} AND status = 'searching' AND driver_id IS NULL
        RETURNING id, driver_id
      `;
      if (!claimed.length) {
        return NextResponse.json({ error: 'এই রাইড ইতিমধ্যে অন্য চালক নিয়েছেন।' }, { status: 409 });
      }
      return NextResponse.json({ success: true, rideId, status: 'accepted' });
    }

    if (status === 'arrived' || status === 'ongoing') {
      if (actor !== 'driver') return forbidden('Only the assigned driver can update this ride');

      if (status === 'ongoing') {
        if (!otpPin || String(otpPin).trim() !== String(ride.rider_otp_pin || '').trim()) {
          return NextResponse.json({ error: 'Invalid OTP PIN' }, { status: 400 });
        }
      }

      const updated = await sql`
        UPDATE rides
        SET status = ${status},
            started_at = CASE WHEN ${status} = 'ongoing' THEN NOW() ELSE started_at END,
            updated_at = NOW()
        WHERE id = ${rideId} AND driver_id = ${payload.userId} AND status = ${ride.status}
        RETURNING id
      `;
      if (!updated.length) {
        return NextResponse.json({ error: 'Ride state changed; refresh and retry' }, { status: 409 });
      }
      return NextResponse.json({ success: true, rideId, status });
    }

    if (status === 'cancelled') {
      const reason = typeof cancelReason === 'string' ? cancelReason.slice(0, 500) : null;
      await sql`
        UPDATE rides
        SET status = 'cancelled',
            cancelled_by = ${actor},
            cancel_reason = COALESCE(${reason}, cancel_reason),
            updated_at = NOW()
        WHERE id = ${rideId}
      `;
      if (ride.driver_id) {
        await sql`UPDATE driver_profiles SET is_online = true, updated_at = NOW() WHERE user_id = ${ride.driver_id}`;
      }
      return NextResponse.json({ success: true, rideId, status: 'cancelled' });
    }

    if (status === 'completed') {
      if (actor !== 'driver' && actor !== 'admin') {
        return forbidden('Only the assigned driver can complete a ride');
      }

      const estimatedFare = Number(ride.estimated_fare) || 0;

      // The fare is the server estimate. An admin may override it; a driver may
      // only adjust within a small tolerance. Anything else is ignored.
      let fare = estimatedFare;
      const proposed = Number(finalFare);
      if (Number.isFinite(proposed) && proposed > 0) {
        if (actor === 'admin') {
          fare = Math.min(proposed, estimatedFare * 3);
        } else if (isFareWithinTolerance(estimatedFare, proposed)) {
          fare = proposed;
        }
      }
      fare = Math.round(fare * 100) / 100;

      const completed = await sql`
        UPDATE rides
        SET status = 'completed',
            final_fare = ${fare},
            completed_at = NOW(),
            payment_status = CASE WHEN payment_method = 'cash' THEN 'pending' ELSE 'paid' END,
            updated_at = NOW()
        WHERE id = ${rideId} AND status = 'ongoing'
        RETURNING id, driver_id, vehicle_type
      `;

      if (!completed.length) {
        return NextResponse.json({ error: 'Ride is not in progress' }, { status: 409 });
      }

      const commissionPct = (() => {
        const type = normalizeVehicleType(ride.vehicle_type);
        return type ? VEHICLE_FARE_RATES[type].commissionRate * 100 : 9;
      })();

      if (ride.driver_id) {
        const commissionAmt = Math.round(fare * (commissionPct / 100) * 100) / 100;
        const netAmount = Math.round((fare - commissionAmt) * 100) / 100;
        const driverUpi = await sql`SELECT upi_id FROM driver_profiles WHERE user_id = ${ride.driver_id}`;

        // Guarded by NOT EXISTS as well as the unique index, so retries and
        // concurrent completions cannot create duplicate earnings.
        await sql`
          INSERT INTO earnings (driver_id, ride_id, gross_amount, commission_pct, commission_amt, net_amount, payout_upi)
          SELECT ${ride.driver_id}, ${rideId}, ${fare}, ${commissionPct}, ${commissionAmt}, ${netAmount}, ${driverUpi[0]?.upi_id ?? null}
          WHERE NOT EXISTS (SELECT 1 FROM earnings WHERE ride_id = ${rideId})
        `;

        await sql`
          UPDATE driver_profiles
          SET total_rides = total_rides + 1, updated_at = NOW()
          WHERE user_id = ${ride.driver_id}
        `;
      }

      return NextResponse.json({ success: true, rideId, status: 'completed', fare });
    }

    return NextResponse.json({ error: 'Unsupported status' }, { status: 400 });
  } catch (error) {
    return serverError('rides/[id] PATCH', error);
  }
}
