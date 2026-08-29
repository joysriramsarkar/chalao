import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userResult = await sql`
      SELECT id, phone, name, role, is_active, avatar_url, emergency_contact, emergency_name, created_at
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

    return NextResponse.json({
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
    console.error('[me] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { name, emergencyContact, emergencyName } = await req.json();

    await sql`
      UPDATE users
      SET name = COALESCE(${name}, name),
          emergency_contact = COALESCE(${emergencyContact}, emergency_contact),
          emergency_name = COALESCE(${emergencyName}, emergency_name),
          updated_at = NOW()
      WHERE id = ${payload.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[me PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
