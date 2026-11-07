/**
 * Deletes the rows created by API smoke tests for the given phone numbers.
 *
 * Usage: node scripts/cleanup-test-users.mjs +919000000001 +919000000002
 *
 * Refuses to run without an explicit phone list, and only touches rows linked
 * to those users.
 */
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const phones = process.argv.slice(2).map((p) => p.trim()).filter(Boolean);
if (!phones.length) {
  console.error('Usage: node scripts/cleanup-test-users.mjs <phone> [phone...]');
  process.exit(1);
}

const sql = neon(databaseUrl);

const users = await sql`SELECT id, phone, role FROM users WHERE phone = ANY(${phones})`;
if (!users.length) {
  console.log('No matching users; nothing to clean.');
  process.exit(0);
}

const ids = users.map((u) => u.id);
console.log('Deleting test data for:', users.map((u) => `${u.phone} (#${u.id}, ${u.role})`).join(', '));

await sql`DELETE FROM earnings WHERE driver_id = ANY(${ids}) OR ride_id IN (SELECT id FROM rides WHERE rider_id = ANY(${ids}) OR driver_id = ANY(${ids}))`;
await sql`DELETE FROM rides WHERE rider_id = ANY(${ids}) OR driver_id = ANY(${ids})`;
await sql`DELETE FROM driver_locations WHERE driver_id = ANY(${ids})`;
await sql`DELETE FROM driver_profiles WHERE user_id = ANY(${ids})`;
await sql`DELETE FROM otp_logs WHERE phone = ANY(${phones})`;
const deleted = await sql`DELETE FROM users WHERE id = ANY(${ids}) RETURNING id`;

console.log(`Removed ${deleted.length} user(s) and their test rides/earnings.`);
