import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export function generateStaticParams() {
  return [{ id: '1' }];
}

type Params = { params: { id: string } };

// GET /api/rides/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const rideId = parseInt(params.id);
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

    // Authorization check
    if (payload.role === 'rider' && ride.rider_id !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role === 'driver' && ride.driver_id !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ride });
  } catch (error) {
    console.error('[rides/id GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/rides/[id] — Update ride status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const rideId = parseInt(params.id);
    const body = await req.json();
    const { status, riderRating, riderReview, driverRating, driverReview, cancelReason, finalFare, otpPin } = body;

    // Get current ride
    const rideResult = await sql`SELECT * FROM rides WHERE id = ${rideId}`;
    if (!rideResult.length) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    const ride = rideResult[0];

    // OTP pin verification (driver verifying rider OTP before trip starts)
    if (status === 'ongoing' && payload.role === 'driver') {
      if (!otpPin || otpPin !== ride.rider_otp_pin) {
        return NextResponse.json({ error: 'Invalid OTP PIN' }, { status: 400 });
      }
    }

    // Driver accepting ride
    if (status === 'accepted' && payload.role === 'driver') {
      await sql`
        UPDATE rides
        SET status = 'accepted', driver_id = ${payload.userId}, updated_at = NOW()
        WHERE id = ${rideId} AND status = 'searching'
      `;
    } else if (status === 'completed') {
      const fare = finalFare || ride.estimated_fare;
      await sql`
        UPDATE rides
        SET status = 'completed',
            final_fare = ${fare},
            completed_at = NOW(),
            payment_status = 'paid',
            rider_rating = COALESCE(${riderRating}, rider_rating),
            rider_review = COALESCE(${riderReview}, rider_review),
            driver_rating = COALESCE(${driverRating}, driver_rating),
            driver_review = COALESCE(${driverReview}, driver_review),
            updated_at = NOW()
        WHERE id = ${rideId}
      `;

      // Create earnings record
      if (ride.driver_id) {
        const commissionPct = 9.0;
        const commissionAmt = (fare * commissionPct) / 100;
        const netAmount = fare - commissionAmt;
        const driverUpi = await sql`SELECT upi_id FROM driver_profiles WHERE user_id = ${ride.driver_id}`;
        
        await sql`
          INSERT INTO earnings (driver_id, ride_id, gross_amount, commission_pct, commission_amt, net_amount, payout_upi)
          VALUES (${ride.driver_id}, ${rideId}, ${fare}, ${commissionPct}, ${commissionAmt}, ${netAmount}, ${driverUpi[0]?.upi_id})
        `;
        
        // Update driver stats
        await sql`
          UPDATE driver_profiles 
          SET total_rides = total_rides + 1,
              rating = (rating * total_rides + COALESCE(${driverRating}, 5)) / (total_rides + 1),
              updated_at = NOW()
          WHERE user_id = ${ride.driver_id}
        `;
      }
    } else {
      await sql`
        UPDATE rides
        SET status = ${status},
            cancelled_by = CASE WHEN ${status} = 'cancelled' THEN ${payload.role} ELSE cancelled_by END,
            cancel_reason = COALESCE(${cancelReason}, cancel_reason),
            started_at = CASE WHEN ${status} = 'ongoing' THEN NOW() ELSE started_at END,
            rider_rating = COALESCE(${riderRating}, rider_rating),
            rider_review = COALESCE(${riderReview}, rider_review),
            updated_at = NOW()
        WHERE id = ${rideId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[rides/id PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
