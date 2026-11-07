import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { setDriverKycStatus } from '@/lib/kyc';
import { serverError, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST /api/admin/drivers/[id]/verify — Approve or reject driver KYC (admin only)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireRole(req, 'admin');
    if (!payload) return unauthorized('Admin authentication required');

    await runMigrations();

    const { status, notes } = await req.json().catch(() => ({}));
    const result = await setDriverKycStatus(params.id, status, notes);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: `চালক KYC সফলভাবে ${result.kycStatus === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} করা হয়েছে।`,
      userId: result.userId,
      kycStatus: result.kycStatus,
    });
  } catch (error) {
    return serverError('admin/drivers/[id]/verify POST', error);
  }
}
