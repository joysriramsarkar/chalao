import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Add it to .env.local or export it before running this script.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
  console.log('Connecting to Neon PostgreSQL...');
  try {
    // Users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            BIGSERIAL PRIMARY KEY,
        phone         VARCHAR(20) NOT NULL UNIQUE,
        name          VARCHAR(120),
        email         VARCHAR(200),
        avatar_url    TEXT,
        role          VARCHAR(20) NOT NULL DEFAULT 'rider',
        is_active     BOOLEAN NOT NULL DEFAULT true,
        emergency_contact VARCHAR(20),
        emergency_name    VARCHAR(120),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shares_owned INT NOT NULL DEFAULT 0`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;

    // OTP logs
    await sql`
      CREATE TABLE IF NOT EXISTS otp_logs (
        id          BIGSERIAL PRIMARY KEY,
        phone       VARCHAR(20) NOT NULL,
        otp_code    VARCHAR(10) NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN NOT NULL DEFAULT false,
        attempts    INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_logs(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_logs(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_logs(phone, created_at DESC)`;

    // Driver profiles
    await sql`
      CREATE TABLE IF NOT EXISTS driver_profiles (
        id              BIGSERIAL PRIMARY KEY,
        user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        aadhaar_number  VARCHAR(20),
        pan_number      VARCHAR(20),
        dl_number       VARCHAR(30),
        dl_expiry       DATE,
        rc_number       VARCHAR(30),
        vehicle_make    VARCHAR(60),
        vehicle_model   VARCHAR(60),
        vehicle_year    INT,
        vehicle_color   VARCHAR(40),
        vehicle_type    VARCHAR(30) DEFAULT 'sedan',
        upi_id          VARCHAR(100),
        bank_account    VARCHAR(40),
        bank_ifsc       VARCHAR(20),
        kyc_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
        kyc_notes       TEXT,
        is_online       BOOLEAN NOT NULL DEFAULT false,
        rating          NUMERIC(3,2) DEFAULT 5.00,
        total_rides     INT NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;
    await sql`ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS aadhaar_photo_url TEXT`;
    await sql`ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS pan_photo_url TEXT`;
    await sql`ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS dl_photo_url TEXT`;
    await sql`ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS rc_photo_url TEXT`;
    await sql`ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT`;

    // Driver locations
    await sql`
      CREATE TABLE IF NOT EXISTS driver_locations (
        driver_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        latitude    DOUBLE PRECISION NOT NULL,
        longitude   DOUBLE PRECISION NOT NULL,
        heading     DOUBLE PRECISION,
        speed       DOUBLE PRECISION,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (driver_id)
      )
    `;

    // Rides
    await sql`
      CREATE TABLE IF NOT EXISTS rides (
        id                  BIGSERIAL PRIMARY KEY,
        rider_id            BIGINT NOT NULL REFERENCES users(id),
        driver_id           BIGINT REFERENCES users(id),
        vehicle_type        VARCHAR(30) NOT NULL DEFAULT 'sedan',
        status              VARCHAR(30) NOT NULL DEFAULT 'searching',
        pickup_lat          DOUBLE PRECISION NOT NULL,
        pickup_lng          DOUBLE PRECISION NOT NULL,
        pickup_address      TEXT NOT NULL,
        dropoff_lat         DOUBLE PRECISION NOT NULL,
        dropoff_lng         DOUBLE PRECISION NOT NULL,
        dropoff_address     TEXT NOT NULL,
        estimated_fare      NUMERIC(10,2),
        final_fare          NUMERIC(10,2),
        distance_km         NUMERIC(8,2),
        duration_mins       INT,
        payment_method      VARCHAR(20) DEFAULT 'cash',
        payment_status      VARCHAR(20) DEFAULT 'pending',
        rider_otp_pin       VARCHAR(6),
        rider_rating        INT,
        rider_review        TEXT,
        driver_rating       INT,
        driver_review       TEXT,
        cancelled_by        VARCHAR(20),
        cancel_reason       TEXT,
        started_at          TIMESTAMPTZ,
        completed_at        TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE rides ALTER COLUMN status SET DEFAULT 'searching'`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rides_searching ON rides(status, vehicle_type) WHERE status = 'searching'`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rides_driver_status ON rides(driver_id, status)`;

    // Earnings
    await sql`
      CREATE TABLE IF NOT EXISTS earnings (
        id              BIGSERIAL PRIMARY KEY,
        driver_id       BIGINT NOT NULL REFERENCES users(id),
        ride_id         BIGINT REFERENCES rides(id),
        gross_amount    NUMERIC(10,2) NOT NULL,
        commission_pct  NUMERIC(5,2) NOT NULL DEFAULT 9.00,
        commission_amt  NUMERIC(10,2) NOT NULL,
        net_amount      NUMERIC(10,2) NOT NULL,
        payout_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
        payout_upi      VARCHAR(100),
        payout_at       TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_driver ON earnings(driver_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_payout ON earnings(payout_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_driver_pending ON earnings(driver_id, payout_status)`;
    await sql`UPDATE rides SET vehicle_type = 'car' WHERE vehicle_type IN ('sedan', 'suv')`;
    await sql`UPDATE rides SET vehicle_type = 'green' WHERE vehicle_type = 'ev'`;
    await sql`UPDATE driver_profiles SET vehicle_type = 'car' WHERE vehicle_type IN ('sedan', 'suv')`;
    await sql`UPDATE driver_profiles SET vehicle_type = 'green' WHERE vehicle_type = 'ev'`;
    await sql`ALTER TABLE driver_profiles ALTER COLUMN vehicle_type SET DEFAULT 'car'`;

    try {
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_earnings_ride ON earnings(ride_id) WHERE ride_id IS NOT NULL`;
    } catch (err) {
      console.warn(
        'Could not create uq_earnings_ride — duplicate earnings rows exist. ' +
          'Resolve them manually, then re-run the migration.',
        err
      );
    }

    // Saved addresses
    await sql`
      CREATE TABLE IF NOT EXISTS saved_addresses (
        id          BIGSERIAL PRIMARY KEY,
        user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label       VARCHAR(50) NOT NULL,
        address     TEXT NOT NULL,
        latitude    DOUBLE PRECISION,
        longitude   DOUBLE PRECISION,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    console.log('✅ Schema migration completed successfully on Neon PostgreSQL!');

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('Current tables in Neon DB:', tables.map((t) => t.table_name));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
