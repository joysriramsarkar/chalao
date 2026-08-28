import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { generateToken } from '@/lib/auth';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    await runMigrations();
    const { phone, role = 'rider' } = await req.json();

    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/[\s-]/g, '');

    // Invalidate old OTPs
    await sql`
      UPDATE otp_logs SET used = true
      WHERE phone = ${normalizedPhone} AND used = false
    `;

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await sql`
      INSERT INTO otp_logs (phone, otp_code, expires_at)
      VALUES (${normalizedPhone}, ${otp}, ${expiresAt.toISOString()})
    `;

    // In production: send SMS via MSG91/2Factor/Twilio
    // In development: log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP DEV] Phone: ${normalizedPhone} | OTP: ${otp}`);
    } else {
      // TODO: Integrate SMS provider
      // await sendSMS(normalizedPhone, `Your Chalao OTP is ${otp}. Valid for 10 minutes.`);
      console.log(`[OTP] Sent to ${normalizedPhone}`);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // Only expose OTP in dev mode
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp }),
    });
  } catch (error) {
    console.error('[send-otp] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
