import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/admin/drivers — Fetch all registered drivers (admin only)
export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'admin');
    if (!payload) return unauthorized('Admin authentication required');

    await runMigrations();

    const drivers = await sql`
      SELECT 
        u.id,
        u.phone,
        COALESCE(u.name, 'নতুন চালক') AS name,
        u.email,
        u.avatar_url,
        u.is_active,
        u.created_at AS registered_at,
        dp.id AS profile_id,
        COALESCE(dp.kyc_status, 'pending') AS kyc_status,
        dp.aadhaar_number,
        dp.pan_number,
        dp.dl_number,
        dp.dl_expiry,
        dp.rc_number,
        dp.vehicle_make,
        dp.vehicle_model,
        dp.vehicle_year,
        dp.vehicle_color,
        COALESCE(dp.vehicle_type, 'car') AS vehicle_type,
        dp.upi_id,
        dp.bank_account,
        dp.bank_ifsc,
        dp.aadhaar_photo_url,
        dp.pan_photo_url,
        dp.dl_photo_url,
        dp.rc_photo_url,
        dp.vehicle_photo_url,
        COALESCE(dp.is_online, false) AS is_online,
        COALESCE(dp.rating, 5.0) AS rating,
        COALESCE(dp.total_rides, 0) AS total_rides,
        dl.latitude,
        dl.longitude,
        dl.heading,
        dl.updated_at AS location_updated_at,
        COALESCE((
          SELECT SUM(e.net_amount) FROM earnings e
          WHERE e.driver_id = u.id AND e.created_at >= CURRENT_DATE
        ), 0) AS today_earnings,
        COALESCE((
          SELECT COUNT(*)::int FROM earnings e
          WHERE e.driver_id = u.id AND e.created_at >= CURRENT_DATE
        ), 0) AS today_trips,
        COALESCE((
          SELECT SUM(e.net_amount) FROM earnings e
          WHERE e.driver_id = u.id AND e.payout_status = 'pending'
        ), 0) AS wallet_balance,
        COALESCE((
          SELECT SUM(e.commission_amt) * 0.30 FROM earnings e
          WHERE e.driver_id = u.id AND e.created_at >= CURRENT_DATE
        ), 0) AS patronage_accrued,
        EXISTS (
          SELECT 1 FROM rides r
          WHERE r.driver_id = u.id
            AND r.status IN ('accepted', 'arrived', 'ongoing')
        ) AS is_busy
      FROM users u
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      LEFT JOIN driver_locations dl ON dl.driver_id = u.id
      WHERE u.role = 'driver'
      ORDER BY u.created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({
      success: true,
      count: drivers.length,
      drivers: drivers.map((d: any) => {
        const aadhaarClean = String(d.aadhaar_number || '').replace(/\s|-/g, '');
        const panClean = String(d.pan_number || '').trim().toUpperCase();
        const dlClean = String(d.dl_number || '').trim().toUpperCase();
        const rcClean = String(d.rc_number || '').trim().toUpperCase();

        const isAadhaarValid = /^\d{12}$/.test(aadhaarClean);
        const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean);
        const isDlValid = /^[A-Z]{2}[0-9A-Z\s/-]{8,20}$/.test(dlClean);
        const isRcValid = /^[A-Z]{2}[0-9A-Z\s/-]{6,15}$/.test(rcClean);

        return {
          id: `d-${d.id}`,
          dbId: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email,
          photoUrl: d.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          vehicleType: d.vehicle_type,
          vehicleModel: d.vehicle_model
            ? `${d.vehicle_make || ''} ${d.vehicle_model}`.trim()
            : d.vehicle_type === 'bike'
              ? 'Hero Splendor'
              : 'Maruti Suzuki Dzire',
          vehicleColor: d.vehicle_color || 'সাদা',
          vehicleNumber: d.rc_number || 'WB-02-Pending',
          dlNumber: d.dl_number || 'DL-Pending',
          aadhaarNumber: d.aadhaar_number || 'XXXX-XXXX-XXXX',
          panNumber: d.pan_number || 'XXXXX0000X',
          upiId: d.upi_id || `${d.phone}@upi`,
          aadhaarPhotoUrl: d.aadhaar_photo_url || null,
          panPhotoUrl: d.pan_photo_url || null,
          dlPhotoUrl: d.dl_photo_url || null,
          rcPhotoUrl: d.rc_photo_url || null,
          vehiclePhotoUrl: d.vehicle_photo_url || null,
          isAadhaarValid,
          isPanValid,
          isDlValid,
          isRcValid,
          rating: Number(d.rating) || 5.0,
          totalTrips: Number(d.total_rides) || 0,
          verificationStatus:
            d.kyc_status === 'approved' ? 'verified' : d.kyc_status === 'rejected' ? 'rejected' : 'pending',
          kycStatus: d.kyc_status,
          isOnline: Boolean(d.is_online),
          isBusy: Boolean(d.is_busy),
          location: {
            // Proper null checks: 0 is a valid coordinate.
            lat: d.latitude !== null && d.latitude !== undefined ? Number(d.latitude) : 22.5726,
            lng: d.longitude !== null && d.longitude !== undefined ? Number(d.longitude) : 88.3639,
            address: 'কলকাতা, পশ্চিমবঙ্গ',
          },
          registeredAt: d.registered_at,
          locationUpdatedAt: d.location_updated_at,
          todayEarnings: Number(d.today_earnings) || 0,
          todayTrips: Number(d.today_trips) || 0,
          walletBalance: Number(d.wallet_balance) || 0,
          patronageAccrued: Number(d.patronage_accrued) || 0,
        };
      }),
    });
  } catch (error) {
    return serverError('admin/drivers GET', error);
  }
}
