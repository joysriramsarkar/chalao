import { NextResponse } from 'next/server';
import { sql, runMigrations } from '@/lib/db';

export async function GET() {
  try {
    await runMigrations();
    const result = await sql`SELECT 1 as alive`;
    return NextResponse.json({
      status: 'ok',
      service: 'Chalao Backend API',
      database: 'connected (Neon PostgreSQL)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      service: 'Chalao Backend API',
      database: 'disconnected',
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
