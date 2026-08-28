-- Chalao Co-op Ride Platform — Neon PostgreSQL Schema
-- Run this on your Neon DB console

-- Enable PostGIS extension for geo queries (optional but useful)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────
-- USERS (both riders and drivers)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  phone         VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(120),
  email         VARCHAR(200),
  avatar_url    TEXT,
  role          VARCHAR(20) NOT NULL DEFAULT 'rider',  -- rider | driver | admin
  is_active     BOOLEAN NOT NULL DEFAULT true,
  emergency_contact VARCHAR(20),
  emergency_name    VARCHAR(120),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ─────────────────────────────────────────────
-- OTP LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_logs (
  id          BIGSERIAL PRIMARY KEY,
  phone       VARCHAR(20) NOT NULL,
  otp_code    VARCHAR(10) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_logs(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_logs(expires_at);

-- ─────────────────────────────────────────────
-- DRIVER PROFILES (KYC)
-- ─────────────────────────────────────────────
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
  vehicle_type    VARCHAR(30) DEFAULT 'sedan', -- bike|auto|sedan|suv|ev
  upi_id          VARCHAR(100),
  bank_account    VARCHAR(40),
  bank_ifsc       VARCHAR(20),
  kyc_status      VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|in_review|approved|rejected
  kyc_notes       TEXT,
  is_online       BOOLEAN NOT NULL DEFAULT false,
  rating          NUMERIC(3,2) DEFAULT 5.00,
  total_rides     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────────
-- DRIVER LOCATIONS (real-time GPS)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  heading     DOUBLE PRECISION,
  speed       DOUBLE PRECISION,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (driver_id)
);

-- ─────────────────────────────────────────────
-- RIDES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rides (
  id                  BIGSERIAL PRIMARY KEY,
  rider_id            BIGINT NOT NULL REFERENCES users(id),
  driver_id           BIGINT REFERENCES users(id),
  vehicle_type        VARCHAR(30) NOT NULL DEFAULT 'sedan',
  status              VARCHAR(30) NOT NULL DEFAULT 'requested',
  -- requested|searching|offered|accepted|arrived|pickup_confirmed|ongoing|completed|cancelled|disputed

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

  payment_method      VARCHAR(20) DEFAULT 'cash', -- cash|upi|wallet
  payment_status      VARCHAR(20) DEFAULT 'pending', -- pending|paid

  rider_otp_pin       VARCHAR(6),
  rider_rating        INT,
  rider_review        TEXT,
  driver_rating       INT,
  driver_review       TEXT,

  cancelled_by        VARCHAR(20), -- rider|driver|system
  cancel_reason       TEXT,

  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);

-- ─────────────────────────────────────────────
-- DRIVER EARNINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earnings (
  id              BIGSERIAL PRIMARY KEY,
  driver_id       BIGINT NOT NULL REFERENCES users(id),
  ride_id         BIGINT REFERENCES rides(id),
  gross_amount    NUMERIC(10,2) NOT NULL,
  commission_pct  NUMERIC(5,2) NOT NULL DEFAULT 9.00, -- 8-10% coop commission
  commission_amt  NUMERIC(10,2) NOT NULL,
  net_amount      NUMERIC(10,2) NOT NULL,
  payout_status   VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|paid
  payout_upi      VARCHAR(100),
  payout_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_driver ON earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_earnings_payout ON earnings(payout_status);

-- ─────────────────────────────────────────────
-- SAVED ADDRESSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_addresses (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(50) NOT NULL, -- home|work|other
  address     TEXT NOT NULL,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
