import { NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    await runMigrations();
    await sql`SELECT 1 as alive`;

    return NextResponse.json({
      status: 'ok',
      service: 'Chalao Backend API',
      database: 'connected',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] Database check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        service: 'Chalao Backend API',
        database: 'disconnected',
        // Never expose connection strings or driver errors to the public.
        ...(process.env.NODE_ENV !== 'production' ? { error: String(error) } : {}),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
