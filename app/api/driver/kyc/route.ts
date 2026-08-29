import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export const revalidate = 0;

// GET /api/driver/kyc — Get KYC status
export async function GET(req: NextRequest) {
  try {
    await runMigrations();
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'driver') {
      return NextResponse.json({ error: 'Driver access only' }, { status: 403 });
    }

    const result = await sql`
      SELECT dp.*, u.name, u.phone, u.email
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.user_id = ${payload.userId}
    `;

    return NextResponse.json({ profile: result[0] || null });
  } catch (error) {
    console.error('[driver/kyc GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/driver/kyc — Submit or update KYC details with document photos
export async function POST(req: NextRequest) {
  try {
    await runMigrations();
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'driver') {
      return NextResponse.json({ error: 'Driver access only' }, { status: 403 });
    }

    const {
      aadhaarNumber, panNumber, dlNumber, dlExpiry,
      rcNumber, vehicleMake, vehicleModel, vehicleYear,
      vehicleColor, vehicleType, upiId, bankAccount, bankIfsc,
      aadhaarPhotoUrl, panPhotoUrl, dlPhotoUrl, rcPhotoUrl, vehiclePhotoUrl,
    } = await req.json();

    const existing = await sql`SELECT id FROM driver_profiles WHERE user_id = ${payload.userId}`;

    if (existing.length) {
      await sql`
        UPDATE driver_profiles SET
          aadhaar_number = COALESCE(${aadhaarNumber}, aadhaar_number),
          pan_number = COALESCE(${panNumber}, pan_number),
          dl_number = COALESCE(${dlNumber}, dl_number),
          dl_expiry = COALESCE(${dlExpiry}, dl_expiry),
          rc_number = COALESCE(${rcNumber}, rc_number),
          vehicle_make = COALESCE(${vehicleMake}, vehicle_make),
          vehicle_model = COALESCE(${vehicleModel}, vehicle_model),
          vehicle_year = COALESCE(${vehicleYear}, vehicle_year),
          vehicle_color = COALESCE(${vehicleColor}, vehicle_color),
          vehicle_type = COALESCE(${vehicleType}, vehicle_type),
          upi_id = COALESCE(${upiId}, upi_id),
          bank_account = COALESCE(${bankAccount}, bank_account),
          bank_ifsc = COALESCE(${bankIfsc}, bank_ifsc),
          aadhaar_photo_url = COALESCE(${aadhaarPhotoUrl}, aadhaar_photo_url),
          pan_photo_url = COALESCE(${panPhotoUrl}, pan_photo_url),
          dl_photo_url = COALESCE(${dlPhotoUrl}, dl_photo_url),
          rc_photo_url = COALESCE(${rcPhotoUrl}, rc_photo_url),
          vehicle_photo_url = COALESCE(${vehiclePhotoUrl}, vehicle_photo_url),
          kyc_status = 'in_review',
          updated_at = NOW()
        WHERE user_id = ${payload.userId}
      `;
    } else {
      await sql`
        INSERT INTO driver_profiles (
          user_id, aadhaar_number, pan_number, dl_number, dl_expiry,
          rc_number, vehicle_make, vehicle_model, vehicle_year,
          vehicle_color, vehicle_type, upi_id, bank_account, bank_ifsc,
          aadhaar_photo_url, pan_photo_url, dl_photo_url, rc_photo_url, vehicle_photo_url,
          kyc_status
        ) VALUES (
          ${payload.userId}, ${aadhaarNumber}, ${panNumber}, ${dlNumber}, ${dlExpiry},
          ${rcNumber}, ${vehicleMake}, ${vehicleModel}, ${vehicleYear},
          ${vehicleColor}, ${vehicleType || 'sedan'}, ${upiId}, ${bankAccount}, ${bankIfsc},
          ${aadhaarPhotoUrl}, ${panPhotoUrl}, ${dlPhotoUrl}, ${rcPhotoUrl}, ${vehiclePhotoUrl},
          'in_review'
        )
      `;
    }

    return NextResponse.json({ success: true, message: 'KYC submitted for review' });
  } catch (error) {
    console.error('[driver/kyc POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
