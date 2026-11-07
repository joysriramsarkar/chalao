import { sql } from '@/lib/db';

export type KycDecision = 'approved' | 'rejected';

export interface KycResult {
  ok: boolean;
  status?: number;
  error?: string;
  userId?: number;
  kycStatus?: KycDecision;
}

/**
 * Approves or rejects a driver's KYC after validating the target really is a
 * driver. Shared by both admin verify routes so their behaviour cannot drift.
 */
export async function setDriverKycStatus(
  rawId: unknown,
  decision: unknown,
  notes: unknown
): Promise<KycResult> {
  const idText = String(rawId ?? '').trim();
  const userId = Number.parseInt(idText.replace(/^d-/, ''), 10);

  if (!Number.isFinite(userId) || userId <= 0) {
    return { ok: false, status: 400, error: 'Invalid driver ID' };
  }

  // Only accept the two documented decisions; previously any typo silently
  // rejected the driver.
  if (decision !== 'approved' && decision !== 'rejected' && decision !== 'verified') {
    return { ok: false, status: 400, error: "status must be 'verified'/'approved' or 'rejected'" };
  }
  const kycStatus: KycDecision = decision === 'rejected' ? 'rejected' : 'approved';

  const driver = await sql`SELECT id, role FROM users WHERE id = ${userId}`;
  if (!driver.length) {
    return { ok: false, status: 404, error: 'Driver not found' };
  }
  if (driver[0].role !== 'driver') {
    return { ok: false, status: 400, error: 'Target user is not a driver' };
  }

  const note = typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 1000) : null;

  const existing = await sql`SELECT id FROM driver_profiles WHERE user_id = ${userId}`;
  if (existing.length) {
    await sql`
      UPDATE driver_profiles
      SET kyc_status = ${kycStatus},
          kyc_notes = COALESCE(${note}, kyc_notes),
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  } else {
    await sql`
      INSERT INTO driver_profiles (user_id, kyc_status, kyc_notes)
      VALUES (${userId}, ${kycStatus}, ${note})
    `;
  }

  if (kycStatus === 'approved') {
    await sql`UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ${userId}`;
  } else {
    // A rejected driver must not keep receiving rides.
    await sql`UPDATE driver_profiles SET is_online = false WHERE user_id = ${userId}`;
  }

  return { ok: true, userId, kycStatus };
}
