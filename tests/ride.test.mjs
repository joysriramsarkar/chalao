import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateRideFare,
  estimateDistanceKm,
  estimateDurationMin,
  normalizeVehicleType,
  normalizePhone,
  isValidCoordinate,
  isValidIndianMobile,
  isValidUpiId,
  isValidAadhaar,
  isValidPan,
  canTransition,
  isFareWithinTolerance,
  VEHICLE_FARE_RATES,
} from '../src/lib/ride.ts';

test('vehicle aliases map legacy DB values onto the tariff card', () => {
  assert.equal(normalizeVehicleType('sedan'), 'car');
  assert.equal(normalizeVehicleType('SUV'), 'car');
  assert.equal(normalizeVehicleType('ev'), 'green');
  assert.equal(normalizeVehicleType('bike'), 'bike');
  assert.equal(normalizeVehicleType('helicopter'), null);
  assert.equal(normalizeVehicleType(42), null);
});

test('distance uses the 1.3x road factor and a 1 km floor', () => {
  // ~1.11 km straight line between these two points.
  const d = estimateDistanceKm(22.5726, 88.3639, 22.58, 88.3639);
  assert.ok(d >= 1 && d < 2, `unexpected distance ${d}`);
  assert.equal(estimateDistanceKm(22.5726, 88.3639, 22.5726, 88.3639), 1);
});

test('duration has a four-minute floor', () => {
  assert.equal(estimateDurationMin(0), 4);
  assert.equal(estimateDurationMin(22), 63);
});

test('fare matches the published cooperative tariff', () => {
  const fare = calculateRideFare('bike', 10, 30, false);
  // 25 base + round(10*9)=90 + round(30*0.5)=15 => 130
  assert.equal(fare.grossFare, 130);
  assert.equal(fare.platformFee, 10); // 8%
  assert.equal(fare.driverNet, 120);
  assert.equal(fare.riderPayable, 130);
  assert.equal(fare.memberRebate, 0);
});

test('member rebate is 5% and never changes driver pay', () => {
  const nonMember = calculateRideFare('car', 8, 20, false);
  const member = calculateRideFare('car', 8, 20, true);
  assert.equal(member.grossFare, nonMember.grossFare);
  assert.equal(member.driverNet, nonMember.driverNet);
  assert.equal(member.memberRebate, Math.round(nonMember.grossFare * 0.05));
  assert.equal(member.riderPayable, nonMember.grossFare - member.memberRebate);
});

test('commission stays inside the advertised 5–10% band', () => {
  for (const rate of Object.values(VEHICLE_FARE_RATES)) {
    assert.ok(rate.commissionRate >= 0.05 && rate.commissionRate <= 0.1);
  }
});

test('coordinates reject junk but accept zero and the poles', () => {
  assert.equal(isValidCoordinate(0, 0), true);
  assert.equal(isValidCoordinate(-90, 180), true);
  assert.equal(isValidCoordinate(91, 0), false);
  assert.equal(isValidCoordinate(0, 181), false);
  assert.equal(isValidCoordinate('abc', 12), false);
  assert.equal(isValidCoordinate(null, 12), false);
});

test('phone normalisation handles the formats users actually type', () => {
  assert.equal(normalizePhone('98300-99887'), '+919830099887');
  assert.equal(normalizePhone('09830099887'), '+919830099887');
  assert.equal(normalizePhone('919830099887'), '+919830099887');
  assert.equal(normalizePhone('+91 98300 99887'), '+919830099887');
  assert.equal(isValidIndianMobile('12345'), false);
  assert.equal(isValidIndianMobile('9830099887'), true);
});

test('document and UPI validators', () => {
  assert.equal(isValidAadhaar('9821 4451 8912'), true);
  assert.equal(isValidAadhaar('1234'), false);
  assert.equal(isValidPan('ABCDE1234F'), true);
  assert.equal(isValidPan('abcde1234f'), true);
  assert.equal(isValidPan('ABCD12345F'), false);
  assert.equal(isValidUpiId('driver@oksbi'), true);
  assert.equal(isValidUpiId('not-a-upi'), false);
});

test('ride status machine enforces role-appropriate transitions', () => {
  assert.equal(canTransition('searching', 'accepted', 'driver'), true);
  assert.equal(canTransition('searching', 'completed', 'driver'), false);
  assert.equal(canTransition('searching', 'accepted', 'rider'), false);
  assert.equal(canTransition('accepted', 'arrived', 'driver'), true);
  assert.equal(canTransition('arrived', 'ongoing', 'driver'), true);
  assert.equal(canTransition('ongoing', 'completed', 'driver'), true);
  assert.equal(canTransition('ongoing', 'cancelled', 'rider'), false);
  assert.equal(canTransition('completed', 'cancelled', 'admin'), false);
  assert.equal(canTransition('searching', 'cancelled', 'rider'), true);
});

test('final fare tolerance blocks tampering but allows waiting time', () => {
  assert.equal(isFareWithinTolerance(100, 100), true);
  assert.equal(isFareWithinTolerance(100, 90), true);
  assert.equal(isFareWithinTolerance(100, 120), true);
  assert.equal(isFareWithinTolerance(100, 40), false);
  assert.equal(isFareWithinTolerance(100, 500), false);
  assert.equal(isFareWithinTolerance(0, 100), false);
});
