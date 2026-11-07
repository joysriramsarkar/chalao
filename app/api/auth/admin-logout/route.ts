import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/auth/admin-logout — clear the httpOnly admin cookie.
// Clearing localStorage alone left a valid 12-hour cookie behind.
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('chalao_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
