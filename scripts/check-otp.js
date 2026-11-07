/**
 * Debug helper: inspect recent OTP rows without printing the codes.
 *
 * Requires DATABASE_URL. This file previously hard-coded a production
 * connection string and printed live OTPs; both were removed.
 */
const { neon } = require('@neondatabase/serverless');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  const now = await sql`SELECT NOW() as db_now`;
  console.log('DB NOW:', now[0].db_now);
  console.log('JS Date.now():', new Date().toISOString());

  const otps = await sql`
    SELECT id, phone, used, attempts, expires_at, created_at,
           RIGHT(otp_code, 2) AS otp_tail
    FROM otp_logs
    ORDER BY id DESC
    LIMIT 10
  `;

  console.log(
    'Recent OTP logs (codes masked):',
    otps.map((row) => ({
      ...row,
      otp_tail: `***${row.otp_tail}`,
    }))
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
