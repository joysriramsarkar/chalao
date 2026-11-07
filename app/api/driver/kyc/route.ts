import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import {
  normalizeVehicleType,
  isValidAadhaar,
  isValidPan,
  isValidDrivingLicence,
  isValidVehicleRegistration,
  isValidUpiId,
} from '@/lib/ride';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

function clean(value: unknown, max = 120): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * Only http(s) and inline base64 images are accepted. This blocks
 * `javascript:`/`file:` URLs from reaching the admin console's <img> tags.
 */
function cleanPhotoUrl(value: unknown): string | null | false {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2_000_000) return false;
  if (!/^(https?:\/\/|data:image\/(png|jpe?g|webp);base64,)/i.test(trimmed)) return false;
  return trimmed;
}

// GET /api/driver/kyc — Get KYC status
export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    await runMigrations();

    const result = await sql`
      SELECT dp.*, u.name, u.phone, u.email
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.user_id = ${payload.userId}
    `;

    return NextResponse.json({ profile: result[0] || null });
  } catch (error) {
    return serverError('driver/kyc GET', error);
  }
}

// POST /api/driver/kyc — Submit or update KYC details and document photos
export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, 'driver');
    if (!payload) return unauthorized('Driver access only');

    await runMigrations();

    const body = await req.json().catch(() => ({}));

    // Accept the field names used by both mobile clients (the rider app's
    // onboarding helper used licenseNumber/vehicleNumber, which the old API
    // silently dropped).
    const aadhaarNumber = clean(body.aadhaarNumber, 20);
    const panNumber = clean(body.panNumber, 20)?.toUpperCase() ?? null;
    const dlNumber = clean(body.dlNumber ?? body.licenseNumber, 30)?.toUpperCase() ?? null;
    const dlExpiryRaw = clean(body.dlExpiry ?? body.licenseExpiry, 20);
    const rcNumber = clean(body.rcNumber ?? body.vehicleNumber, 30)?.toUpperCase() ?? null;

    if (aadhaarNumber && !isValidAadhaar(aadhaarNumber)) {
      return NextResponse.json({ error: 'আধার নম্বর ১২ সংখ্যার হতে হবে।' }, { status: 400 });
    }
    if (panNumber && !isValidPan(panNumber)) {
      return NextResponse.json({ error: 'PAN নম্বরের ফরম্যাট সঠিক নয় (ABCDE1234F)।' }, { status: 400 });
    }
    if (dlNumber && !isValidDrivingLicence(dlNumber)) {
      return NextResponse.json({ error: 'ড্রাইভিং লাইসেন্স নম্বরের ফরম্যাট সঠিক নয়।' }, { status: 400 });
    }
    if (rcNumber && !isValidVehicleRegistration(rcNumber)) {
      return NextResponse.json({ error: 'গাড়ির রেজিস্ট্রেশন নম্বরের ফরম্যাট সঠিক নয়।' }, { status: 400 });
    }

    let dlExpiry: string | null = null;
    if (dlExpiryRaw) {
      const parsed = new Date(dlExpiryRaw);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'ড্রাইভিং লাইসেন্সের মেয়াদের তারিখ সঠিক নয়।' }, { status: 400 });
      }
      dlExpiry = parsed.toISOString().slice(0, 10);
    }

    const vehicleTypeRaw = clean(body.vehicleType, 30);
    const vehicleType = vehicleTypeRaw ? normalizeVehicleType(vehicleTypeRaw) : null;
    if (vehicleTypeRaw && !vehicleType) {
      return NextResponse.json({ error: 'অসমর্থিত বাহনের ধরন।' }, { status: 400 });
    }

    const vehicleYearRaw = Number(body.vehicleYear);
    const currentYear = new Date().getFullYear();
    const vehicleYear =
      Number.isInteger(vehicleYearRaw) && vehicleYearRaw >= 1980 && vehicleYearRaw <= currentYear + 1
        ? vehicleYearRaw
        : null;

    const upiId = clean(body.upiId, 100);
    if (upiId && !isValidUpiId(upiId)) {
      return NextResponse.json({ error: 'UPI আইডির ফরম্যাট সঠিক নয় (যেমন name@bank)।' }, { status: 400 });
    }

    const aadhaarPhotoUrl = cleanPhotoUrl(body.aadhaarPhotoUrl);
    const panPhotoUrl = cleanPhotoUrl(body.panPhotoUrl);
    const dlPhotoUrl = cleanPhotoUrl(body.dlPhotoUrl);
    const rcPhotoUrl = cleanPhotoUrl(body.rcPhotoUrl);
    const vehiclePhotoUrl = cleanPhotoUrl(body.vehiclePhotoUrl);

    if (
      [aadhaarPhotoUrl, panPhotoUrl, dlPhotoUrl, rcPhotoUrl, vehiclePhotoUrl].some(
        (value) => value === false
      )
    ) {
      return NextResponse.json(
        { error: 'ছবির লিংক সঠিক নয়। শুধু http(s) বা base64 image গ্রহণ করা হয়।' },
        { status: 400 }
      );
    }

    // Narrow the union after validation so the SQL template only sees strings.
    const aadhaarUrl = aadhaarPhotoUrl === false ? null : aadhaarPhotoUrl;
    const panUrl = panPhotoUrl === false ? null : panPhotoUrl;
    const dlUrl = dlPhotoUrl === false ? null : dlPhotoUrl;
    const rcUrl = rcPhotoUrl === false ? null : rcPhotoUrl;
    const vehicleUrl = vehiclePhotoUrl === false ? null : vehiclePhotoUrl;

    const existing = await sql`SELECT id FROM driver_profiles WHERE user_id = ${payload.userId}`;

    if (existing.length) {
      await sql`
        UPDATE driver_profiles SET
          aadhaar_number = COALESCE(${aadhaarNumber}, aadhaar_number),
          pan_number = COALESCE(${panNumber}, pan_number),
          dl_number = COALESCE(${dlNumber}, dl_number),
          dl_expiry = COALESCE(${dlExpiry}, dl_expiry),
          rc_number = COALESCE(${rcNumber}, rc_number),
          vehicle_make = COALESCE(${clean(body.vehicleMake, 60)}, vehicle_make),
          vehicle_model = COALESCE(${clean(body.vehicleModel, 60)}, vehicle_model),
          vehicle_year = COALESCE(${vehicleYear}, vehicle_year),
          vehicle_color = COALESCE(${clean(body.vehicleColor, 40)}, vehicle_color),
          vehicle_type = COALESCE(${vehicleType}, vehicle_type),
          upi_id = COALESCE(${upiId}, upi_id),
          bank_account = COALESCE(${clean(body.bankAccount, 40)}, bank_account),
          bank_ifsc = COALESCE(${clean(body.bankIfsc, 20)}, bank_ifsc),
          aadhaar_photo_url = COALESCE(${aadhaarUrl}, aadhaar_photo_url),
          pan_photo_url = COALESCE(${panUrl}, pan_photo_url),
          dl_photo_url = COALESCE(${dlUrl}, dl_photo_url),
          rc_photo_url = COALESCE(${rcUrl}, rc_photo_url),
          vehicle_photo_url = COALESCE(${vehicleUrl}, vehicle_photo_url),
          kyc_status = CASE WHEN kyc_status = 'rejected' THEN 'pending' ELSE 'in_review' END,
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
          ${rcNumber}, ${clean(body.vehicleMake, 60)}, ${clean(body.vehicleModel, 60)}, ${vehicleYear},
          ${clean(body.vehicleColor, 40)}, ${vehicleType || 'car'}, ${upiId},
          ${clean(body.bankAccount, 40)}, ${clean(body.bankIfsc, 20)},
          ${aadhaarUrl}, ${panUrl}, ${dlUrl}, ${rcUrl}, ${vehicleUrl},
          'in_review'
        )
      `;
    }

    return NextResponse.json({ success: true, message: 'KYC submitted for review' });
  } catch (error) {
    return serverError('driver/kyc POST', error);
  }
}
