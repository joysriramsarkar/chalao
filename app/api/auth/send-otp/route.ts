import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';
import { normalizePhone, isValidIndianMobile } from '@/lib/ride';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/** Development OTP echo. Never enabled by default in production. */
function devOtpEnabled(): boolean {
  const flag = process.env.CHALAO_DEV_OTP;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function generateOtp(): string {
  // crypto-backed randomness instead of Math.random()
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (100000 + (bytes[0] % 900000)).toString();
}

function maskPhone(phone: string): string {
  return phone.length > 4 ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : '****';
}

export async function POST(req: NextRequest) {
  try {
    await runMigrations();

    const limit = rateLimit(`send-otp:${clientIp(req)}`, 20, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'অনেকবার OTP অনুরোধ করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const normalizedPhone = normalizePhone(body?.phone);

    if (!isValidIndianMobile(normalizedPhone)) {
      return NextResponse.json(
        { error: 'সঠিক ১০-সংখ্যার ভারতীয় মোবাইল নম্বর দিন।' },
        { status: 400 }
      );
    }

    const phoneLimit = rateLimit(`send-otp:phone:${normalizedPhone}`, 5, 10 * 60 * 1000);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { error: 'এই নম্বরের জন্য অনেকবার OTP পাঠানো হয়েছে। ১০ মিনিট পরে চেষ্টা করুন।' },
        { status: 429, headers: { 'Retry-After': String(phoneLimit.retryAfterSeconds) } }
      );
    }

    const devMode = devOtpEnabled();
    const smsConfigured = Boolean(process.env.SMS_API_KEY);

    // Without a gateway and without dev mode the OTP can never reach the user.
    // Fail honestly instead of creating an unusable code.
    if (!devMode && !smsConfigured) {
      console.error('[send-otp] No SMS gateway configured and CHALAO_DEV_OTP is disabled.');
      return NextResponse.json(
        { error: 'SMS পরিষেবা এখনও কনফিগার করা হয়নি। অনুগ্রহ করে সহায়তা টিমের সঙ্গে যোগাযোগ করুন।' },
        { status: 503 }
      );
    }

    // Invalidate previous unused OTPs for this number.
    await sql`
      UPDATE otp_logs SET used = true
      WHERE phone = ${normalizedPhone} AND used = false
    `;

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await sql`
      INSERT INTO otp_logs (phone, otp_code, expires_at)
      VALUES (${normalizedPhone}, ${otp}, ${expiresAt.toISOString()})
    `;

    if (devMode) {
      console.log(`[OTP][dev] Generated for ${maskPhone(normalizedPhone)}: ${otp}`);
    } else {
      console.log(`[OTP] Generated for ${maskPhone(normalizedPhone)}`);
      // TODO: integrate the configured gateway (Fast2SMS / MSG91 / 2Factor).
      // The request must only be reported as sent after the provider accepts it.
    }

    return NextResponse.json({
      success: true,
      message: devMode ? 'OTP তৈরি হয়েছে (ডেভ মোড)।' : 'OTP পাঠানো হয়েছে।',
      expiresInSeconds: 600,
      ...(devMode ? { dev_otp: otp } : {}),
    });
  } catch (error) {
    console.error('[send-otp] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
