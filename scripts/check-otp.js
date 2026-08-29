const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_64RtyULSflxa@ep-aged-rice-azw9ms8b-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const now = await sql`SELECT NOW() as db_now`;
  console.log('DB NOW:', now[0].db_now);
  console.log('JS Date.now():', new Date().toISOString());

  const otps = await sql`SELECT * FROM otp_logs ORDER BY id DESC LIMIT 10`;
  console.log('Recent OTP logs:', otps);
}

main();
