/**
 * Chalao — authoritative ride domain rules.
 *
 * This module is the single source of truth for vehicle pricing, distance,
 * phone normalisation, fare maths and the ride status machine. Both the API
 * routes and the tests import it, so the price shown in the app and the price
 * charged by the backend can never drift apart again.
 *
 * Keep this file free of runtime-only dependencies: it is executed directly by
 * `node --test` (type stripping) as well as by Next.js.
 */

export type CanonicalVehicleType = 'bike' | 'auto' | 'car' | 'pink' | 'share' | 'green';

export type RideStatus =
  | 'searching'
  | 'accepted'
  | 'arrived'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type RideActor = 'rider' | 'driver' | 'admin';

export interface FareRate {
  baseFare: number;
  perKm: number;
  perMin: number;
  commissionRate: number;
}

/**
 * Cooperative tariff card (5–10% platform fee). Mirrors `VEHICLE_OPTIONS` in
 * `src/data/initialState.ts`; the previous API used a different, undocumented
 * table which made the app quote one fare and the server store another.
 */
export const VEHICLE_FARE_RATES: Record<CanonicalVehicleType, FareRate> = {
  bike: { baseFare: 25, perKm: 9, perMin: 0.5, commissionRate: 0.08 },
  auto: { baseFare: 35, perKm: 12, perMin: 0.8, commissionRate: 0.09 },
  car: { baseFare: 70, perKm: 18, perMin: 1.5, commissionRate: 0.1 },
  pink: { baseFare: 30, perKm: 11, perMin: 0.6, commissionRate: 0.05 },
  share: { baseFare: 20, perKm: 7, perMin: 0.4, commissionRate: 0.08 },
  green: { baseFare: 30, perKm: 10, perMin: 0.5, commissionRate: 0.06 },
};

/** Legacy DB / partner values that map onto the canonical tariff card. */
const VEHICLE_ALIASES: Record<string, CanonicalVehicleType> = {
  sedan: 'car',
  suv: 'car',
  ev: 'green',
  electric: 'green',
  cab: 'car',
  taxi: 'car',
  auto_rickshaw: 'auto',
};

export const CANONICAL_VEHICLE_TYPES = Object.keys(VEHICLE_FARE_RATES) as CanonicalVehicleType[];

export function normalizeVehicleType(value: unknown): CanonicalVehicleType | null {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  if ((CANONICAL_VEHICLE_TYPES as string[]).includes(key)) {
    return key as CanonicalVehicleType;
  }
  return VEHICLE_ALIASES[key] ?? null;
}

/** Great-circle distance in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
}

/**
 * Road distance estimate used by the rider UI: 1.3× the straight line, rounded
 * to 100 m, never below 1 km.
 */
export function estimateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const straight = haversineKm(lat1, lng1, lat2, lng2);
  return Math.max(1, Math.round(straight * 1.3 * 10) / 10);
}

/** Urban speed 22 km/h plus a 3-minute pickup buffer, minimum 4 minutes. */
export function estimateDurationMin(distanceKm: number): number {
  return Math.max(4, Math.round((distanceKm / 22) * 60 + 3));
}

export interface RideFare {
  vehicleType: CanonicalVehicleType;
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  grossFare: number;
  commissionPercent: number;
  platformFee: number;
  driverNet: number;
  memberRebate: number;
  riderPayable: number;
}

export function calculateRideFare(
  vehicleType: CanonicalVehicleType,
  distanceKm: number,
  durationMin: number,
  isMember = false
): RideFare {
  const rate = VEHICLE_FARE_RATES[vehicleType];
  const safeDistance = Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const safeDuration = Number.isFinite(durationMin) && durationMin > 0 ? durationMin : 0;

  const baseFare = rate.baseFare;
  const distanceFare = Math.round(safeDistance * rate.perKm);
  const timeFare = Math.round(safeDuration * rate.perMin);
  const grossFare = baseFare + distanceFare + timeFare;

  const platformFee = Math.round(grossFare * rate.commissionRate);
  const driverNet = grossFare - platformFee;
  const memberRebate = isMember ? Math.round(grossFare * 0.05) : 0;

  return {
    vehicleType,
    distanceKm: safeDistance,
    durationMin: safeDuration,
    baseFare,
    distanceFare,
    timeFare,
    grossFare,
    commissionPercent: Math.round(rate.commissionRate * 1000) / 10,
    platformFee,
    driverNet,
    memberRebate,
    riderPayable: grossFare - memberRebate,
  };
}

/**
 * Accepts only real-world WGS84 coordinates. Zero is a legitimate value
 * (equator / prime meridian), so truthiness checks must not be used here.
 */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value);
    return NaN;
  };
  const latitude = toNumber(lat);
  const longitude = toNumber(lng);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Normalises Indian mobile numbers to E.164 (+91XXXXXXXXXX). */
export function normalizePhone(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let clean = raw.replace(/[^\d+]/g, '');
  if (clean.startsWith('0091')) clean = '+91' + clean.slice(4);
  if (clean.startsWith('0') && clean.length === 11) clean = '+91' + clean.slice(1);
  if (/^91\d{10}$/.test(clean)) clean = '+' + clean;
  if (/^\d{10}$/.test(clean)) clean = '+91' + clean;
  if (!clean.startsWith('+') && clean.length >= 10) clean = '+' + clean;
  return clean;
}

export function isValidIndianMobile(raw: unknown): boolean {
  return /^\+91[6-9]\d{9}$/.test(normalizePhone(raw));
}

export function isValidUpiId(raw: unknown): boolean {
  return typeof raw === 'string' && /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(raw.trim());
}

export function isValidAadhaar(raw: unknown): boolean {
  return typeof raw === 'string' && /^\d{12}$/.test(raw.replace(/\s|-/g, ''));
}

export function isValidPan(raw: unknown): boolean {
  return typeof raw === 'string' && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(raw.trim().toUpperCase());
}

export function isValidDrivingLicence(raw: unknown): boolean {
  return typeof raw === 'string' && /^[A-Z]{2}[0-9A-Z\s/-]{8,20}$/.test(raw.trim().toUpperCase());
}

export function isValidVehicleRegistration(raw: unknown): boolean {
  return typeof raw === 'string' && /^[A-Z]{2}[0-9A-Z\s/-]{6,15}$/.test(raw.trim().toUpperCase());
}

const TRANSITIONS: Record<RideStatus, Partial<Record<RideActor, RideStatus[]>>> = {
  searching: {
    driver: ['accepted'],
    rider: ['cancelled'],
    admin: ['accepted', 'cancelled'],
  },
  accepted: {
    driver: ['arrived', 'cancelled'],
    rider: ['cancelled'],
    admin: ['arrived', 'cancelled'],
  },
  arrived: {
    driver: ['ongoing', 'cancelled'],
    rider: ['cancelled'],
    admin: ['ongoing', 'cancelled'],
  },
  ongoing: {
    driver: ['completed'],
    admin: ['completed', 'cancelled'],
  },
  completed: {
    admin: [],
  },
  cancelled: {
    admin: [],
  },
};

export function canTransition(from: RideStatus | string, to: RideStatus, actor: RideActor): boolean {
  const allowed = TRANSITIONS[from as RideStatus]?.[actor];
  return Array.isArray(allowed) && allowed.includes(to);
}

/**
 * A driver may only adjust the final fare slightly (waiting time, tolls). The
 * server rejects the client value outside this band and falls back to its own
 * estimate instead.
 */
export function isFareWithinTolerance(estimatedFare: number, proposedFare: number): boolean {
  if (!Number.isFinite(estimatedFare) || estimatedFare <= 0) return false;
  if (!Number.isFinite(proposedFare) || proposedFare <= 0) return false;
  return proposedFare >= Math.round(estimatedFare * 0.85) && proposedFare <= Math.round(estimatedFare * 1.25);
}

export const RIDE_STATUSES: RideStatus[] = [
  'searching',
  'accepted',
  'arrived',
  'ongoing',
  'completed',
  'cancelled',
];
