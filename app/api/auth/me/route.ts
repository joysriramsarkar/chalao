import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isValidIndianMobile, normalizePhone } from '@/lib/ride';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

function publicUser(user: any) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatar_url,
    emergencyContact: user.emergency_contact,
    emergencyName: user.emergency_name,
    isMember: Boolean(user.is_member),
    sharesOwned: Number(user.shares_owned || 0),
    createdAt: user.created_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized('No valid session');

    const userResult = await sql`
      SELECT id, phone, name, role, is_active, avatar_url, emergency_contact,
             emergency_name, is_member, shares_owned, created_at
      FROM users
      WHERE id = ${payload.userId}
    `;

    if (!userResult.length || !userResult[0].is_active) {
      return NextResponse.json({ error: 'User not found or suspended' }, { status: 404 });
    }

    const user = userResult[0];
    let driverProfile = null;

    if (user.role === 'driver') {
      const dp = await sql`
        SELECT kyc_status, vehicle_type, vehicle_make, vehicle_model, vehicle_color,
               upi_id, is_online, rating, total_rides
        FROM driver_profiles
        WHERE user_id = ${user.id}
      `;
      driverProfile = dp[0] || null;
    }

    return NextResponse.json({ user: publicUser(user), driverProfile });
  } catch (error) {
    return serverError('auth/me GET', error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : null;
    const avatarUrl = typeof body?.avatarUrl === 'string' ? body.avatarUrl.trim().slice(0, 2000) : null;
    const emergencyName =
      typeof body?.emergencyName === 'string' ? body.emergencyName.trim().slice(0, 120) : null;
    const emergencyContactRaw =
      typeof body?.emergencyContact === 'string' ? body.emergencyContact.trim() : null;

    if (name !== null && name.length < 2) {
      return NextResponse.json({ error: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }, { status: 400 });
    }

    let emergencyContact: string | null = null;
    if (emergencyContactRaw) {
      emergencyContact = normalizePhone(emergencyContactRaw);
      if (!isValidIndianMobile(emergencyContact)) {
        return NextResponse.json({ error: 'জরুরি যোগাযোগের নম্বর সঠিক নয়।' }, { status: 400 });
      }
    }

    const updated = await sql`
      UPDATE users
      SET name = COALESCE(${name}, name),
          avatar_url = COALESCE(${avatarUrl}, avatar_url),
          emergency_contact = COALESCE(${emergencyContact}, emergency_contact),
          emergency_name = COALESCE(${emergencyName}, emergency_name),
          updated_at = NOW()
      WHERE id = ${payload.userId}
      RETURNING id, phone, name, role, is_active, avatar_url, emergency_contact,
                emergency_name, is_member, shares_owned, created_at
    `;

    if (!updated.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user: publicUser(updated[0]) });
  } catch (error) {
    return serverError('auth/me PATCH', error);
  }
}
