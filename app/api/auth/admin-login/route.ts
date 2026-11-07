import { NextRequest, NextResponse } from 'next/server';
import { generateToken, verifyAdminCredentials } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`admin-login:${clientIp(req)}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'অনেকবার ভুল চেষ্টা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '');

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।' },
        { status: 400 }
      );
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { success: false, error: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!' },
        { status: 401 }
      );
    }

    // Short-lived admin session; userId 0 is reserved for the env-configured
    // operator account because it has no row in `users`.
    const token = await generateToken(
      { userId: 0, phone: '+91 99999 99999', role: 'admin' },
      '12h'
    );

    const response = NextResponse.json({
      success: true,
      message: 'অ্যাডমিন সফলভাবে লগইন হয়েছেন।',
      token,
      user: {
        id: 0,
        username: username.toLowerCase(),
        name: 'চালাও সমবায় অ্যাডমিনিস্ট্রেটর (Admin)',
        role: 'admin',
        permissions: ['ALL_DISPATCH', 'KYC_APPROVAL', 'PRICING_OVERRIDE', 'EMERGENCY_DISPATCH'],
      },
    });

    response.cookies.set('chalao_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[admin-login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'লগইন প্রক্রিয়া ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
