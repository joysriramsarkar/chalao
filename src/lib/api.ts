import { NextResponse } from 'next/server';

/** Standard 401 for missing/invalid tokens. */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** Standard 403 for authenticated users without the required role. */
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Logs the real error server-side but only echoes details in development, so
 * SQL messages and connection strings never reach clients in production.
 */
export function serverError(scope: string, error: unknown) {
  console.error(`[${scope}] Error:`, error);
  const body: { error: string; details?: string } = { error: 'Internal server error' };
  if (process.env.NODE_ENV !== 'production') {
    body.details = String(error);
  }
  return NextResponse.json(body, { status: 500 });
}
