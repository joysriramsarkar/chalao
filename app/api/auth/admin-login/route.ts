import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString().trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।' },
        { status: 400 }
      );
    }

    // Official Chalao Admin Credentials: admin / echo123
    if (username === 'admin' && password === 'echo123') {
      const token = await generateToken({
        userId: 1,
        phone: '+91 99999 99999',
        role: 'admin'
      });

      const response = NextResponse.json({
        success: true,
        message: 'অ্যাডমিন সফলভাবে লগইন হয়েছেন।',
        token,
        user: {
          id: 1,
          username: 'admin',
          name: 'চালাও সমবায় অ্যাডমিনিস্ট্রেটর (Admin)',
          role: 'admin',
          permissions: ['ALL_DISPATCH', 'KYC_APPROVAL', 'PRICING_OVERRIDE', 'EMERGENCY_DISPATCH']
        }
      });

      // Set cookie for session
      response.cookies.set('chalao_admin_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য দিন।' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'লগইন প্রক্রিয়া ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
