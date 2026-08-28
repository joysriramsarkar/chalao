export type Role = 'rider' | 'driver' | 'member' | 'admin';

export type Language = 'bn' | 'hi' | 'en';

export type Currency = 'INR' | 'BDT' | 'USD';

export type CityId = 'kolkata' | 'delhi' | 'mumbai' | 'bengaluru' | 'dhaka';

export type RideStatus = 
  | 'IDLE'
  | 'SEARCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'PAID'
  | 'CANCELLED';

export type VehicleType = 'bike' | 'auto' | 'car' | 'pink' | 'share' | 'green';

export interface VehicleOption {
  id: VehicleType;
  nameBn: string;
  nameHi: string;
  nameEn: string;
  descBn: string;
  descHi: string;
  descEn: string;
  icon: string;
  baseFare: number;
  perKm: number;
  perMin: number;
  capacity: number;
  commissionRate: number; // e.g. 0.08 for 8%
  etaMin: number;
}

export interface LocationPoint {
  id: string;
  cityId: CityId;
  nameBn: string;
  nameHi: string;
  nameEn: string;
  areaBn: string;
  areaHi: string;
  areaEn: string;
  lat: number;
  lng: number;
}

export interface CityConfig {
  id: CityId;
  nameBn: string;
  nameHi: string;
  nameEn: string;
  stateEn: string;
  country: string;
  center: [number, number];
  currency: Currency;
  currencySymbol: string;
  emergencyNumber: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  cityId: CityId;
  photo: string;
  rating: number;
  totalTrips: number;
  vehicleType: VehicleType;
  vehicleModel: string;
  plateNumber: string;
  isOnline: boolean;
  isBusy: boolean;
  isMember: boolean;
  memberId?: string;
  lat: number;
  lng: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  todayEarnings: number;
  todayTrips: number;
  patronageAccrued: number;
  sharesOwned: number;
  licenseNumber: string;
  aadhaarNumber?: string;
  panNumber?: string;
  rcNumber: string;
  upiId?: string;
  walletBalance: number;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  cityId: CityId;
  photo: string;
  rating: number;
  isMember: boolean;
  memberId?: string;
  sharesOwned: number;
  patronagePoints: number;
  walletBalance: number;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  savedPlaces?: {
    id: string;
    label: string;
    address: string;
    lat: number;
    lng: number;
  }[];
}

export interface RideDetails {
  id: string;
  cityId: CityId;
  riderId: string;
  riderName: string;
  riderPhone: string;
  riderRating: number;
  driver?: Driver;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  vehicleType: VehicleType;
  distanceKm: number;
  estimatedDurationMin: number;
  fareAmount: number;
  platformFee: number;
  driverEarnings: number;
  patronageRebate: number;
  status: RideStatus;
  otp: string;
  paymentMethod: 'upi' | 'cash' | 'wallet' | 'card';
  paymentStatus: 'pending' | 'paid';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  routePolyline?: [number, number][];
  currentPos?: [number, number];
}

export interface TripHistoryItem {
  id: string;
  date: string;
  pickupName: string;
  dropoffName: string;
  vehicleType: VehicleType;
  fare: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled';
  driverName?: string;
  riderName?: string;
}

export interface CoOpMotion {
  id: string;
  titleBn: string;
  titleHi: string;
  titleEn: string;
  descriptionBn: string;
  descriptionHi: string;
  descriptionEn: string;
  category: 'commission' | 'welfare' | 'fare' | 'technology' | 'governance';
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligible: number;
  deadline: string;
  status: 'active' | 'passed' | 'rejected';
  myVote?: 'yes' | 'no' | 'abstain';
}

export interface IncidentReport {
  id: string;
  rideId: string;
  reporterRole: 'rider' | 'driver';
  reporterName: string;
  type: 'sos' | 'route_deviation' | 'fare_dispute' | 'harassment' | 'accident' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PricingRule {
  vehicleType: VehicleType;
  baseFare: number;
  perKm: number;
  perMin: number;
  minFare: number;
  platformCommissionPercent: number;
  surgeMultiplier: number;
}
