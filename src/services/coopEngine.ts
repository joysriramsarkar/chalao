import { VehicleOption, Currency } from '../types';

export interface FareBreakdown {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  timeMinutes: number;
  timeFare: number;
  subtotal: number;
  surgeMultiplier: number;
  totalGrossFare: number;
  coopCommissionPercent: number;
  platformFee: number;
  driverTakeHome: number;
  driverTakeHomePercent: number;
  memberPatronageRebate: number;
  finalRiderPayable: number;
  
  // Transparency allocation of the platform fee (MoRTH / Co-op principles)
  feeAllocation: {
    legalReserve: number;       // 25% (Mandatory statutory reserve)
    techAndPlatform: number;    // 15% (Cloud, GPS, App R&D)
    driverWelfareAndPatronage: number; // 30% (Cash bonus & Health Fund)
    riderRebatePool: number;    // 15% (Discounts on future trips)
    accidentInsurancePool: number; // 10% (Immediate emergency support)
    shareholderDividend: number; // 5% (Dividends on member shares)
  };
}

export function calculateFare(
  vehicle: VehicleOption,
  distanceKm: number,
  timeMinutes: number,
  isMember: boolean = false,
  surgeMultiplier: number = 1.0
): FareBreakdown {
  const baseFare = vehicle.baseFare;
  const distanceFare = Math.round(distanceKm * vehicle.perKm);
  const timeFare = Math.round(timeMinutes * vehicle.perMin);
  const subtotal = baseFare + distanceFare + timeFare;
  const totalGrossFare = Math.round(subtotal * surgeMultiplier);

  // Cooperative platform fee: between 5% - 10% (unlike corporate 25-30%)
  const coopCommissionPercent = vehicle.commissionRate * 100;
  const platformFee = Math.round(totalGrossFare * vehicle.commissionRate);
  const driverTakeHome = totalGrossFare - platformFee;
  const driverTakeHomePercent = 100 - coopCommissionPercent;

  // Member gets 5% instant patronage rebate
  const memberPatronageRebate = isMember ? Math.round(totalGrossFare * 0.05) : 0;
  const finalRiderPayable = totalGrossFare - memberPatronageRebate;

  const feeAllocation = {
    legalReserve: Math.round(platformFee * 0.25),
    techAndPlatform: Math.round(platformFee * 0.15),
    driverWelfareAndPatronage: Math.round(platformFee * 0.30),
    riderRebatePool: Math.round(platformFee * 0.15),
    accidentInsurancePool: Math.round(platformFee * 0.10),
    shareholderDividend: Math.round(platformFee * 0.05)
  };

  return {
    baseFare,
    distanceKm,
    distanceFare,
    timeMinutes,
    timeFare,
    subtotal,
    surgeMultiplier,
    totalGrossFare,
    coopCommissionPercent,
    platformFee,
    driverTakeHome,
    driverTakeHomePercent,
    memberPatronageRebate,
    finalRiderPayable,
    feeAllocation
  };
}

export interface PatronageProjection {
  driverTripsMonthly: number;
  averageFare: number;
  monthlyDriverGross: number;
  monthlyPlatformFeePaid: number;
  projectedAnnualPatronageBonus: number;
  projectedDividendOnShares: number;
  totalAnnualCoopBenefit: number;
  corporateComparisonLoss: number; // How much they lose on a 25% corporate monopoly
}

export function projectDriverPatronage(
  dailyTrips: number,
  avgFare: number,
  sharesOwned: number = 10
): PatronageProjection {
  const driverTripsMonthly = dailyTrips * 26;
  const monthlyDriverGross = driverTripsMonthly * avgFare;
  const monthlyPlatformFeePaid = monthlyDriverGross * 0.09; // 9% average co-op fee
  
  // 30% of platform fees return as patronage pool + activity weight
  const annualFeePaid = monthlyPlatformFeePaid * 12;
  const projectedAnnualPatronageBonus = Math.round(annualFeePaid * 0.35);
  
  // ₹500 per share with 8% projected co-op dividend
  const shareCapital = sharesOwned * 500;
  const projectedDividendOnShares = Math.round(shareCapital * 0.08);
  
  const totalAnnualCoopBenefit = projectedAnnualPatronageBonus + projectedDividendOnShares;
  
  // Corporate app takes 25%
  const corporateAnnualFee = (monthlyDriverGross * 12) * 0.25;
  const coOpAnnualFee = annualFeePaid - projectedAnnualPatronageBonus;
  const corporateComparisonLoss = Math.round(corporateAnnualFee - coOpAnnualFee);

  return {
    driverTripsMonthly,
    averageFare: avgFare,
    monthlyDriverGross,
    monthlyPlatformFeePaid,
    projectedAnnualPatronageBonus,
    projectedDividendOnShares,
    totalAnnualCoopBenefit,
    corporateComparisonLoss
  };
}

export const COOP_FINANCIAL_SUMMARY_2026 = {
  totalGrossRideVolumeINR: 24500000, // ₹2.45 Crore
  totalCompletedRides: 198420,
  activeCoopMembers: 5840,
  activeDriverOwners: 1920,
  activeRiderMembers: 3920,
  totalPlatformFeesCollectedINR: 2205000, // 9% average
  allocatedSurplus: {
    legalReserveINR: 551250,       // 25%
    techAndPlatformINR: 330750,    // 15%
    driverPatronagePoolINR: 661500,// 30%
    riderRebatePoolINR: 330750,    // 15%
    welfareAndInsuranceINR: 220500,// 10%
    shareholderDividendINR: 110250 // 5%
  }
};
