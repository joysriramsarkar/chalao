import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { generateToken, safeEqual } from '@/lib/auth';
import { normalizePhone, isValidIndianMobile } from '@/lib/ride';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;

function devOtpEnabled(): boolean {
  const flag = process.env.CHALAO_DEV_OTP;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export async function POST(req: NextRequest) {
  try {
    await runMigrations();

    const ipLimit = rateLimit(`verify-otp:${clientIp(req)}`, 30, 10 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'অনেকবার চেষ্টা হয়েছে। পরে আবার চেষ্টা করুন।' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const normalizedPhone = normalizePhone(body?.phone);
    const trimmedOtp = String(body?.otp ?? '').trim();
    const requestedRole = body?.role === 'driver' ? 'driver' : 'rider';

    if (!isValidIndianMobile(normalizedPhone) || !/^\d{6}$/.test(trimmedOtp)) {
      return NextResponse.json(
        { error: 'সঠিক মোবাইল নম্বর ও ৬-সংখ্যার OTP দিন।' },
        { status: 400 }
      );
    }

    const phoneLimit = rateLimit(`verify-otp:phone:${normalizedPhone}`, 10, 10 * 60 * 1000);
    if (!phoneLimit.allowed) {
      return NextResponse.json({ error: 'এই নম্বরের জন্য অনেকবার চেষ্টা হয়েছে।' }, { status: 429 });
    }

    const otpRecord = await sql`
      SELECT id, otp_code, expires_at, used, attempts
      FROM otp_logs
      WHERE phone = ${normalizedPhone}
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const record = otpRecord[0];

    if (record && Number(record.attempts) >= MAX_ATTEMPTS) {
      await sql`UPDATE otp_logs SET used = true WHERE id = ${record.id}`;
      return NextResponse.json(
        { error: 'এই OTP-এর চেষ্টার সীমা শেষ। নতুন OTP নিন।' },
        { status: 429 }
      );
    }

    const matchesDbOtp = Boolean(record) && safeEqual(String(record.otp_code), trimmedOtp);
    // The universal demo code only exists outside production and only when the
    // dev flag has not explicitly disabled it.
    const matchesDevOtp = devOtpEnabled() && trimmedOtp === '123456';

    if (!matchesDbOtp && !matchesDevOtp) {
      if (record) {
        await sql`UPDATE otp_logs SET attempts = attempts + 1 WHERE id = ${record.id}`;
      }
      return NextResponse.json(
        { error: 'ভুল OTP কোড। অনুগ্রহ করে সঠিক ৬ সংখ্যার কোড লিখুন।' },
        { status: 401 }
      );
    }

    // Consume the code atomically so two parallel requests cannot both use it.
    if (record) {
      const consumed = await sql`
        UPDATE otp_logs SET used = true
        WHERE id = ${record.id} AND used = false
        RETURNING id
      `;
      if (!consumed.length) {
        return NextResponse.json(
          { error: 'এই OTP ইতিমধ্যে ব্যবহার করা হয়েছে। নতুন OTP নিন।' },
          { status: 401 }
        );
      }
    }

    const userResult = await sql`
      INSERT INTO users (phone, role)
      VALUES (${normalizedPhone}, ${requestedRole})
      ON CONFLICT (phone) DO UPDATE
        SET role = CASE
              WHEN users.role = 'admin' THEN 'admin'
              WHEN ${requestedRole} = 'driver' THEN 'driver'
              ELSE users.role
            END,
            updated_at = NOW()
      RETURNING id, phone, name, role, is_active, avatar_url, emergency_contact, emergency_name, created_at
    `;

    const user = userResult[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সহায়তা টিমের সঙ্গে যোগাযোগ করুন।' }, { status: 403 });
    }

    // Admin accounts must sign in through the admin console, never via OTP.
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'এই অ্যাকাউন্ট অ্যাডমিন কনসোল দিয়ে লগইন করতে হবে।' }, { status: 403 });
    }

    let driverProfile = null;
    if (user.role === 'driver') {
      const dp = await sql`
        SELECT kyc_status, vehicle_type, vehicle_make, vehicle_model, dl_number, rc_number, upi_id, is_online, rating, total_rides
        FROM driver_profiles
        WHERE user_id = ${user.id}
      `;
      if (dp.length) {
        driverProfile = dp[0];
      } else {
        const newDp = await sql`
          INSERT INTO driver_profiles (user_id, kyc_status)
          VALUES (${user.id}, 'pending')
          ON CONFLICT (user_id) DO NOTHING
          RETURNING kyc_status, vehicle_type, vehicle_make, vehicle_model, dl_number, rc_number, upi_id, is_online, rating, total_rides
        `;
        driverProfile = newDp[0] || null;
      }
    }

    const token = await generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        emergencyContact: user.emergency_contact,
        emergencyName: user.emergency_name,
        createdAt: user.created_at,
      },
      driverProfile,
    });
  } catch (error) {
    console.error('[verify-otp] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
