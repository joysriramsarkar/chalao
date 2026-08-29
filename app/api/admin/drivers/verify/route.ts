import { NextRequest, NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';

// POST /api/admin/drivers/verify — Approve or reject driver KYC
export async function POST(req: NextRequest) {
  try {
    await runMigrations();
    const { driverId, id, status, notes } = await req.json();
    const rawId = String(driverId || id || '');
    const userId = rawId.startsWith('d-') ? parseInt(rawId.replace('d-', ''), 10) : parseInt(rawId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
    }

    const kycStatus = status === 'verified' || status === 'approved' ? 'approved' : 'rejected';

    // Update driver_profiles
    const existing = await sql`SELECT id FROM driver_profiles WHERE user_id = ${userId}`;

    if (existing.length) {
      await sql`
        UPDATE driver_profiles
        SET kyc_status = ${kycStatus},
            kyc_notes = COALESCE(${notes}, kyc_notes),
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } else {
      await sql`
        INSERT INTO driver_profiles (user_id, kyc_status, kyc_notes)
        VALUES (${userId}, ${kycStatus}, ${notes})
      `;
    }

    // Ensure user is active
    if (kycStatus === 'approved') {
      await sql`UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ${userId}`;
    }

    return NextResponse.json({
      success: true,
      message: `চালক KYC সফলভাবে ${kycStatus === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} করা হয়েছে।`,
      userId,
      kycStatus,
    });
  } catch (error) {
    console.error('[admin/drivers/verify POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
