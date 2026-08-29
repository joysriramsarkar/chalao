import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await runMigrations();
    const { phone, otp, role = 'rider' } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/[\s-]/g, '');

    // Validate OTP
    const otpRecord = await sql`
      SELECT id, otp_code, expires_at, used, attempts
      FROM otp_logs
      WHERE phone = ${normalizedPhone}
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!otpRecord.length) {
      return NextResponse.json({ error: 'OTP expired or not found. Please request a new one.' }, { status: 401 });
    }

    const record = otpRecord[0];

    // Increment attempts
    await sql`
      UPDATE otp_logs SET attempts = attempts + 1 WHERE id = ${record.id}
    `;

    if (record.attempts >= 5) {
      await sql`UPDATE otp_logs SET used = true WHERE id = ${record.id}`;
      return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 429 });
    }

    if (record.otp_code !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    // Mark OTP as used
    await sql`UPDATE otp_logs SET used = true WHERE id = ${record.id}`;

    // Upsert user
    const userResult = await sql`
      INSERT INTO users (phone, role)
      VALUES (${normalizedPhone}, ${role})
      ON CONFLICT (phone) DO UPDATE
        SET updated_at = NOW()
      RETURNING id, phone, name, role, is_active, avatar_url, emergency_contact, emergency_name, created_at
    `;

    const user = userResult[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });
    }

    // For drivers, check KYC
    let driverProfile = null;
    if (user.role === 'driver') {
      const dp = await sql`
        SELECT kyc_status, vehicle_type, upi_id, is_online, rating, total_rides
        FROM driver_profiles
        WHERE user_id = ${user.id}
      `;
      driverProfile = dp[0] || null;
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
