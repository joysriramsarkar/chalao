'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Role, 
  Language, 
  Currency,
  CityId,
  Driver, 
  Rider, 
  RideDetails, 
  LocationPoint, 
  VehicleType, 
  CoOpMotion, 
  IncidentReport, 
  PricingRule,
  VehicleOption,
  CityConfig
} from '../types';
import { 
  INITIAL_DRIVERS, 
  INITIAL_RIDER, 
  INITIAL_MOTIONS, 
  INITIAL_INCIDENTS, 
  INITIAL_PRICING_RULES, 
  VEHICLE_OPTIONS 
} from '../data/initialState';
import { INDIAN_CITIES, CITY_LOCATIONS } from '../data/locations';
import { calculateDistanceKm, estimateDurationMin, generateRoutePoints } from '../services/mapService';
import { calculateFare } from '../services/coopEngine';
import { sound } from '../services/audioService';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  currentCity: CityConfig;
  setCityId: (cityId: CityId) => void;
  availableCities: CityConfig[];
  availableLocations: LocationPoint[];
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  
  // Rider & Driver State
  rider: Rider;
  drivers: Driver[];
  currentDriver: Driver;
  activeRide: RideDetails | null;
  pricingRules: PricingRule[];
  motions: CoOpMotion[];
  incidents: IncidentReport[];
  
  // Actions
  requestRide: (
    pickup: LocationPoint, 
    dropoff: LocationPoint, 
    vehicleType: VehicleType, 
    paymentMethod: 'upi' | 'cash' | 'wallet' | 'card'
  ) => void;
  acceptRide: (driverId?: string) => void;
  declineRide: () => void;
  driverArrived: () => void;
  startTrip: (enteredOtp: string) => boolean;
  completeTrip: () => void;
  confirmPaymentAndReset: () => void;
  cancelRide: (reason?: string) => void;
  
  // Driver Actions
  toggleDriverOnline: () => void;
  verifyDriverKyc: (driverId: string, status: 'verified' | 'rejected') => void;
  
  // Member & Governance Actions
  castVote: (motionId: string, choice: 'yes' | 'no' | 'abstain') => void;
  buyShares: (count: number) => void;
  
  // Safety & SOS
  triggerSOS: (description?: string) => void;
  resolveIncident: (incidentId: string) => void;
  
  // Pricing Updates
  updatePricingRule: (rule: PricingRule) => void;
  
  // Helper
  getVehicleOption: (type: VehicleType) => VehicleOption;
  getCurrencySymbol: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>('rider');
  const [language, setLanguageState] = useState<Language>('bn');
  const [cityId, setCityIdState] = useState<CityId>('kolkata');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  
  const [rider, setRider] = useState<Rider>(INITIAL_RIDER);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [currentDriverId, setCurrentDriverId] = useState<string>('d-kol-01');
  const [activeRide, setActiveRide] = useState<RideDetails | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(INITIAL_PRICING_RULES);
  const [motions, setMotions] = useState<CoOpMotion[]>(INITIAL_MOTIONS);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);

  const currentCity = INDIAN_CITIES.find(c => c.id === cityId) || INDIAN_CITIES[0];
  const availableLocations = CITY_LOCATIONS.filter(l => l.cityId === cityId);
  const currentDriver = drivers.find(d => d.id === currentDriverId) || drivers[0];

  const setRole = (newRole: Role) => {
    sound.playClickSound();
    setRoleState(newRole);
  };

  const setLanguage = (lang: Language) => {
    sound.playClickSound();
    setLanguageState(lang);
  };

  const setCityId = (newCityId: CityId) => {
    sound.playClickSound();
    setCityIdState(newCityId);
    const city = INDIAN_CITIES.find(c => c.id === newCityId);
    if (city) {
      setCurrency(city.currency);
    }
  };

  const setIsMuted = (muted: boolean) => {
    setIsMutedState(muted);
    sound.setMuted(muted);
  };

  const getCurrencySymbol = () => {
    if (currency === 'INR') return '₹';
    if (currency === 'BDT') return '৳';
    return '$';
  };

  const getVehicleOption = (type: VehicleType): VehicleOption => {
    const opt = VEHICLE_OPTIONS.find(v => v.id === type) || VEHICLE_OPTIONS[0];
    const rule = pricingRules.find(r => r.vehicleType === type);
    if (rule) {
      return {
        ...opt,
        baseFare: rule.baseFare,
        perKm: rule.perKm,
        perMin: rule.perMin,
        commissionRate: rule.platformCommissionPercent / 100
      };
    }
    return opt;
  };

  // Ride Request
  const requestRide = (
    pickup: LocationPoint,
    dropoff: LocationPoint,
    vehicleType: VehicleType,
    paymentMethod: 'upi' | 'cash' | 'wallet' | 'card'
  ) => {
    sound.playClickSound();
    const vehicle = getVehicleOption(vehicleType);
    const distanceKm = calculateDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const durationMin = estimateDurationMin(distanceKm);
    const fareInfo = calculateFare(vehicle, distanceKm, durationMin, rider.isMember);
    const routePoints = generateRoutePoints(pickup, dropoff, 30);
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newRide: RideDetails = {
      id: `CH-IN-${Math.floor(100000 + Math.random() * 900000)}`,
      cityId,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      riderRating: rider.rating,
      pickup,
      dropoff,
      vehicleType,
      distanceKm,
      estimatedDurationMin: durationMin,
      fareAmount: fareInfo.finalRiderPayable,
      platformFee: fareInfo.platformFee,
      driverEarnings: fareInfo.driverTakeHome,
      patronageRebate: fareInfo.memberPatronageRebate,
      status: 'SEARCHING',
      otp: generatedOtp,
      paymentMethod,
      paymentStatus: 'pending',
      createdAt: Date.now(),
      routePolyline: routePoints,
      currentPos: routePoints[0]
    };

    setActiveRide(newRide);

    // After 1.2 seconds, trigger ride offer to nearest cooperative driver
    setTimeout(() => {
      setActiveRide(prev => {
        if (!prev || prev.status !== 'SEARCHING') return prev;
        sound.playRideOfferPing();
        return {
          ...prev,
          status: 'OFFERED'
        };
      });
    }, 1200);
  };

  // Driver Accepts Ride
  const acceptRide = (driverId?: string) => {
    const targetDriver = driverId 
      ? drivers.find(d => d.id === driverId) || currentDriver 
      : currentDriver;

    sound.playTripStartedChime();
    
    // Mark driver as busy
    setDrivers(prev => prev.map(d => d.id === targetDriver.id ? { ...d, isBusy: true } : d));

    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        driver: targetDriver,
        status: 'ACCEPTED'
      };
    });
  };

  const declineRide = () => {
    sound.playClickSound();
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'SEARCHING'
      };
    });
  };

  const driverArrived = () => {
    sound.playTripStartedChime();
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'ARRIVED'
      };
    });
  };

  const startTrip = (enteredOtp: string): boolean => {
    if (!activeRide) return false;
    if (enteredOtp.trim() !== activeRide.otp) {
      return false;
    }

    sound.playTripStartedChime();
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'ONGOING',
        startedAt: Date.now()
      };
    });
    return true;
  };

  // Simulated animated route movement during 'ONGOING'
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'ONGOING' || !activeRide.routePolyline) return;

    let stepIndex = 0;
    const totalSteps = activeRide.routePolyline.length;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < totalSteps) {
        const nextPos = activeRide.routePolyline![stepIndex];
        setActiveRide(prev => prev ? { ...prev, currentPos: nextPos } : null);
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRide?.status]);

  const completeTrip = () => {
    sound.playTripCompletedFanfare();
    
    setActiveRide(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        status: 'COMPLETED' as const,
        completedAt: Date.now(),
        paymentStatus: 'pending' as const
      };

      if (prev.driver) {
        const dId = prev.driver.id;
        setDrivers(curr => curr.map(d => {
          if (d.id === dId) {
            return {
              ...d,
              isBusy: false,
              todayEarnings: d.todayEarnings + prev.driverEarnings,
              todayTrips: d.todayTrips + 1,
              patronageAccrued: d.patronageAccrued + Math.round(prev.platformFee * 0.35)
            };
          }
          return d;
        }));
      }

      setRider(r => ({
        ...r,
        patronagePoints: r.patronagePoints + Math.round(prev.fareAmount * 0.1)
      }));

      return updated;
    });
  };

  const confirmPaymentAndReset = () => {
    sound.playCashPing();
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'PAID',
        paymentStatus: 'paid'
      };
    });

    setTimeout(() => {
      setActiveRide(null);
    }, 2500);
  };

  const cancelRide = () => {
    sound.playClickSound();
    if (activeRide?.driver) {
      const dId = activeRide.driver.id;
      setDrivers(curr => curr.map(d => d.id === dId ? { ...d, isBusy: false } : d));
    }
    setActiveRide(null);
  };

  const toggleDriverOnline = () => {
    sound.playClickSound();
    setDrivers(prev => prev.map(d => {
      if (d.id === currentDriver.id) {
        return { ...d, isOnline: !d.isOnline };
      }
      return d;
    }));
  };

  const verifyDriverKyc = (driverId: string, status: 'verified' | 'rejected') => {
    sound.playClickSound();
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return { ...d, verificationStatus: status };
      }
      return d;
    }));
  };

  const castVote = (motionId: string, choice: 'yes' | 'no' | 'abstain') => {
    sound.playTripStartedChime();
    setMotions(prev => prev.map(m => {
      if (m.id === motionId) {
        return {
          ...m,
          myVote: choice,
          yesVotes: choice === 'yes' ? m.yesVotes + 1 : m.yesVotes,
          noVotes: choice === 'no' ? m.noVotes + 1 : m.noVotes,
          abstainVotes: choice === 'abstain' ? m.abstainVotes + 1 : m.abstainVotes
        };
      }
      return m;
    }));
  };

  const buyShares = (count: number) => {
    sound.playTripCompletedFanfare();
    setRider(prev => ({
      ...prev,
      isMember: true,
      memberId: prev.memberId || `CH-IN-M${Math.floor(1000 + Math.random() * 9000)}`,
      sharesOwned: prev.sharesOwned + count
    }));
  };

  const triggerSOS = (description: string = 'Emergency SOS triggered') => {
    sound.playSOSSiren();
    const newIncident: IncidentReport = {
      id: `INC-112-${Date.now()}`,
      rideId: activeRide?.id || 'CH-SOS-MANUAL',
      reporterRole: role === 'driver' ? 'driver' : 'rider',
      reporterName: role === 'driver' ? currentDriver.name : rider.name,
      type: 'sos',
      description,
      status: 'open',
      timestamp: new Date().toLocaleString(),
      severity: 'critical'
    };
    setIncidents(prev => [newIncident, ...prev]);
  };

  const resolveIncident = (incidentId: string) => {
    sound.playClickSound();
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'resolved' } : inc));
  };

  const updatePricingRule = (updated: PricingRule) => {
    sound.playClickSound();
    setPricingRules(prev => prev.map(r => r.vehicleType === updated.vehicleType ? updated : r));
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        currency,
        setCurrency,
        currentCity,
        setCityId,
        availableCities: INDIAN_CITIES,
        availableLocations,
        isMuted,
        setIsMuted,
        rider,
        drivers,
        currentDriver,
        activeRide,
        pricingRules,
        motions,
        incidents,
        requestRide,
        acceptRide,
        declineRide,
        driverArrived,
        startTrip,
        completeTrip,
        confirmPaymentAndReset,
        cancelRide,
        toggleDriverOnline,
        verifyDriverKyc,
        castVote,
        buyShares,
        triggerSOS,
        resolveIncident,
        updatePricingRule,
        getVehicleOption,
        getCurrencySymbol
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
