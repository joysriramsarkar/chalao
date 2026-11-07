# Chalao security notes

This file records the security model, the issues fixed in the hardening pass, and
the operational steps that still need a human.

## Immediate action required: rotate the database password

A Neon PostgreSQL connection string with the `neondb_owner` role and password was
committed to `scripts/migrate-neon.mjs` and `scripts/check-otp.js`. Both files have
been cleaned, but **the password remains in git history** and must be treated as
compromised.

1. Open the Neon console → Project → Roles → `neondb_owner` → Reset password.
2. Update `DATABASE_URL` in `.env.local` and in the Vercel/GitHub Actions secrets.
3. Optionally rewrite history (`git filter-repo`) if the repository is public.

## Authentication

| Actor | Mechanism | Notes |
|---|---|---|
| Rider / Driver | Phone + 6-digit OTP → JWT (30 days) | `/api/auth/send-otp`, `/api/auth/verify-otp` |
| Admin | Username + password → JWT (12 hours) + httpOnly cookie | `/api/auth/admin-login` |

- Admin credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. If
  `ADMIN_PASSWORD` is unset in production, admin login is disabled rather than
  falling back to a known password.
- The universal OTP `123456` and the `dev_otp` response field only exist when
  `CHALAO_DEV_OTP` is enabled (default: non-production only).
- OTPs are single-use, expire after 10 minutes, are locked after 5 wrong attempts,
  and are compared in constant time.
- Public OTP login can never mint an `admin` token; admin accounts must use the
  admin console.

## Authorisation

- `/api/admin/*` requires an `admin` JWT. These endpoints previously leaked
  Aadhaar, PAN, driving-licence and RC data to anonymous callers.
- `/api/rides*` enforces ownership: riders see their rides, drivers only rides
  assigned to them, admins everything.
- A driver never receives the rider's pickup PIN from the read API. The PIN is
  verified server-side when the trip starts.
- Ride status changes follow a role-aware state machine (`src/lib/ride.ts`):
  `searching → accepted → arrived → ongoing → completed`, with cancellation
  allowed only in the documented states.

## Money handling

- Distance, duration and fare are computed on the server from coordinates; a
  tampered client cannot choose its own price.
- Fares use one tariff card shared with the UI (`src/lib/ride.ts`), fixing the
  earlier mismatch where the app quoted one price and the API stored another.
- Accepting a ride is atomic (`UPDATE ... WHERE status = 'searching'`), so two
  drivers can no longer both "win" the same ride.
- Completion only transitions `ongoing → completed`; earnings are inserted once
  per ride (`NOT EXISTS` + unique index where available).
- Payouts update pending earnings in a single statement and reject a mismatched
  partial amount instead of silently paying everything.

## Abuse controls

`src/lib/rateLimit.ts` provides in-memory limits for OTP sending, OTP verification,
admin login and ride creation. This is best-effort per server instance; use Redis
or Upstash when running more than one instance.

## Known limitations (not security regressions)

- No SMS gateway is implemented. Production requires `SMS_API_KEY` and a provider
  integration; without it `send-otp` returns 503 instead of inventing an OTP.
- UPI payouts only update the ledger — no payment gateway transfer is executed.
- Payment capture for UPI/wallet/card is simulated; cash remains `pending` until
  collected.
- KYC approval is recorded and visible to admins, but accepting a ride does not yet require an approved KYC status. Add that gate before a public launch.
- The Next.js web app is a demo console; the Flutter rider/driver apps are the
  clients that use the real API.
- A rider's co-op membership (`users.is_member`) is stored server-side, but there
  is no purchase endpoint yet, so web demo membership does not grant an API rebate.
