import { SignJWT, jwtVerify } from 'jose';
import { createHash, timingSafeEqual } from 'crypto';

const DEV_SECRET = 'chalao-coop-dev-only-secret-change-me-min-32-chars';
let warnedAboutSecret = false;

function getJwtSecret(): Uint8Array {
  const configured = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (configured && configured.length >= 32) {
    return new TextEncoder().encode(configured);
  }

  if (isProduction) {
    // Fail closed: never sign production sessions with a known default key.
    throw new Error('JWT_SECRET must be set to at least 32 characters in production');
  }

  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn('[auth] JWT_SECRET missing or too short — using the development-only key.');
  }
  return new TextEncoder().encode(DEV_SECRET);
}

export interface TokenPayload {
  userId: number;
  phone: string;
  role: string;
}

export async function generateToken(
  payload: TokenPayload,
  expiresIn: string = '30d'
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // The admin panel previously stored the JWT in localStorage *and* an
  // httpOnly cookie. Accepting the cookie keeps server-rendered admin calls
  // working without exposing the token to JavaScript.
  const cookie = req.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)chalao_admin_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function requireAuth(req: Request): Promise<TokenPayload | null> {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(req: Request, role: 'rider' | 'driver' | 'admin'): Promise<TokenPayload | null> {
  const payload = await requireAuth(req);
  if (!payload || payload.role !== role) return null;
  return payload;
}

/** Constant-time string comparison that is safe for unequal lengths. */
export function safeEqual(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a).digest();
  const digestB = createHash('sha256').update(b).digest();
  return timingSafeEqual(digestA, digestB) && a.length === b.length;
}

/**
 * Admin credentials come from the environment. A demo credential is only
 * accepted outside production so local builds and the Capacitor demo keep
 * working without shipping a real password.
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!configuredPassword && isProduction) {
    console.error('[auth] ADMIN_PASSWORD is not configured — admin login is disabled.');
    return false;
  }

  const expectedPassword = configuredPassword || 'echo123';
  return safeEqual(username.trim().toLowerCase(), expectedUser) && safeEqual(password, expectedPassword);
}
