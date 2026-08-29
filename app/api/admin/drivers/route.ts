import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';

export const revalidate = 0;


// GET /api/admin/drivers — Fetch all registered drivers from Neon PostgreSQL
export async function GET(req: NextRequest) {
  try {
    await runMigrations();

    // Query all driver users with their profile and latest location
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
        COALESCE(dp.vehicle_type, 'sedan') AS vehicle_type,
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
        dl.updated_at AS location_updated_at
      FROM users u
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      LEFT JOIN driver_locations dl ON dl.driver_id = u.id
      WHERE u.role = 'driver'
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      count: drivers.length,
      drivers: drivers.map(d => {
        const aadhaarClean = (d.aadhaar_number || '').replace(/\s/g, '');
        const panClean = (d.pan_number || '').trim().toUpperCase();
        const dlClean = (d.dl_number || '').trim().toUpperCase();
        const rcClean = (d.rc_number || '').trim().toUpperCase();

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
          vehicleModel: d.vehicle_model ? `${d.vehicle_make || ''} ${d.vehicle_model}`.trim() : (d.vehicle_type === 'bike' ? 'Hero Splendor' : 'Maruti Suzuki Dzire'),
          vehicleColor: d.vehicle_color || 'সাদা',
          vehicleNumber: d.rc_number || 'WB-02-Pending',
          dlNumber: d.dl_number || 'DL-Pending',
          aadhaarNumber: d.aadhaar_number || 'XXXX-XXXX-XXXX',
          panNumber: d.pan_number || 'XXXXX0000X',
          upiId: d.upi_id || `${d.phone}@upi`,
          // Document Photos
          aadhaarPhotoUrl: d.aadhaar_photo_url || null,
          panPhotoUrl: d.pan_photo_url || null,
          dlPhotoUrl: d.dl_photo_url || null,
          rcPhotoUrl: d.rc_photo_url || null,
          vehiclePhotoUrl: d.vehicle_photo_url || null,
          // Validation Flags
          isAadhaarValid,
          isPanValid,
          isDlValid,
          isRcValid,
          rating: Number(d.rating) || 5.0,
          totalTrips: Number(d.total_rides) || 0,
          verificationStatus: d.kyc_status === 'approved' ? 'verified' : (d.kyc_status === 'rejected' ? 'rejected' : 'pending'),
          kycStatus: d.kyc_status,
          isOnline: Boolean(d.is_online),
          isBusy: false,
          location: {
            lat: d.latitude ? Number(d.latitude) : 22.5726,
            lng: d.longitude ? Number(d.longitude) : 88.3639,
            address: 'কলকাতা, পশ্চিমবঙ্গ'
          },
          registeredAt: d.registered_at,
        };
      }),
    });
  } catch (error) {
    console.error('[admin/drivers GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
