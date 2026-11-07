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
  CityConfig,
  TripHistoryItem
} from '../types';
import { 
  INITIAL_DRIVERS, 
  INITIAL_RIDER, 
  INITIAL_MOTIONS, 
  INITIAL_INCIDENTS, 
  INITIAL_PRICING_RULES, 
  INITIAL_TRIP_HISTORY,
  VEHICLE_OPTIONS 
} from '../data/initialState';
import { INDIAN_CITIES, CITY_LOCATIONS } from '../data/locations';
import { calculateDistanceKm, estimateDurationMin, generateRoutePoints } from '../services/mapService';
import { calculateFare } from '../services/coopEngine';
import { sound } from '../services/audioService';
import { apiFetch, setStoredToken, getStoredToken } from '../lib/apiClient';

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
  
  // Auth state
  isAuthenticated: boolean;
  authRole: 'rider' | 'driver' | null;
  loginAsRider: (phone: string, session?: { token?: string; name?: string }) => void;
  loginAsDriver: (phone: string, session?: { token?: string; name?: string }) => void;
  registerDriver: (data: Partial<Driver>) => void;
  logout: () => void;

  // Admin Auth state
  isAdminAuthenticated: boolean;
  loginAsAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;

  // Rider & Driver State
  rider: Rider;
  drivers: Driver[];
  currentDriver: Driver;
  activeRide: RideDetails | null;
  tripHistory: TripHistoryItem[];
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
  verifyDriverKyc: (driverId: string, status: 'verified' | 'rejected') => Promise<boolean>;
  requestDriverPayout: (amount: number) => boolean;
  
  // Member & Governance Actions
  castVote: (motionId: string, choice: 'yes' | 'no' | 'abstain') => void;
  buyShares: (count: number) => void;
  
  // Safety & SOS
  triggerSOS: (description?: string) => void;
  resolveIncident: (incidentId: string) => void;
  
  // Pricing Updates
  updatePricingRule: (rule: PricingRule) => void;
  
  // Real DB Driver sync
  refreshDrivers: () => Promise<void>;
  isRefreshing: boolean;
  
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Auth state
  // A browser session starts signed out. The previous defaults ('admin' and
  // isAuthenticated = true) let anyone open the rider, driver and admin pages
  // without logging in.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'rider' | 'driver' | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  const [rider, setRider] = useState<Rider>(INITIAL_RIDER);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [currentDriverId, setCurrentDriverId] = useState<string>('d-kol-01');
  const [activeRide, setActiveRide] = useState<RideDetails | null>(null);
  const [tripHistory, setTripHistory] = useState<TripHistoryItem[]>(INITIAL_TRIP_HISTORY);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(INITIAL_PRICING_RULES);
  const [motions, setMotions] = useState<CoOpMotion[]>(INITIAL_MOTIONS);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);

  const currentCity = INDIAN_CITIES.find(c => c.id === cityId) || INDIAN_CITIES[0];
  const availableLocations = CITY_LOCATIONS.filter(l => l.cityId === cityId);
  const currentDriver = drivers.find(d => d.id === currentDriverId) || drivers[0];

  const fetchDriversFromDb = async () => {
    try {
      setIsRefreshing(true);
      const res = await apiFetch('/api/admin/drivers', {}, 'chalao_admin_token');
      if (res.status === 401) {
        // Expired or revoked admin token: drop the session instead of polling
        // forever with a dead credential.
        setStoredToken(null, 'chalao_admin_token');
        setIsAdminAuthenticated(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.drivers)) {
          const validVehicleTypes: VehicleType[] = ['bike', 'auto', 'car', 'pink', 'share', 'green'];
          const mappedDrivers: Driver[] = data.drivers.map((d: any) => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            cityId: 'kolkata',
            photo: d.photoUrl,
            rating: d.rating,
            totalTrips: d.totalTrips,
            // DB values like 'sedan'/'suv' are not part of the VehicleType union —
            // map them to the closest supported type so pricing rules apply correctly.
            vehicleType: validVehicleTypes.includes(d.vehicleType)
              ? (d.vehicleType as VehicleType)
              : (d.vehicleType === 'sedan' ? 'car' : 'bike'),
            vehicleModel: d.vehicleModel,
            plateNumber: d.vehicleNumber,
            isOnline: d.isOnline,
            isBusy: d.isBusy,
            isMember: true,
            memberId: `CH-IN-D${d.dbId}`,
            lat: d.location?.lat || 22.5726,
            lng: d.location?.lng || 88.3639,
            verificationStatus: d.verificationStatus,
            todayEarnings: d.todayEarnings,
            todayTrips: d.todayTrips,
            patronageAccrued: d.patronageAccrued,
            sharesOwned: 10,
            licenseNumber: d.dlNumber,
            aadhaarNumber: d.aadhaarNumber,
            panNumber: d.panNumber,
            rcNumber: d.vehicleNumber,
            upiId: d.upiId,
            walletBalance: d.walletBalance,
            aadhaarPhotoUrl: d.aadhaarPhotoUrl,
            panPhotoUrl: d.panPhotoUrl,
            dlPhotoUrl: d.dlPhotoUrl,
            rcPhotoUrl: d.rcPhotoUrl,
            vehiclePhotoUrl: d.vehiclePhotoUrl,
            isAadhaarValid: d.isAadhaarValid,
            isPanValid: d.isPanValid,
            isDlValid: d.isDlValid,
            isRcValid: d.isRcValid,
          }));
          setDrivers(mappedDrivers);
        }
      }
    } catch (e) {
      console.warn('Could not fetch drivers from Neon DB:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Only the admin console needs the fleet list; polling this protected
    // endpoint from the rider/driver pages just leaked nothing but 401s.
    if (!isAdminAuthenticated) return;

    fetchDriversFromDb();
    const interval = setInterval(fetchDriversFromDb, 15000);
    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);

  const setRole = (newRole: Role) => {
    sound.playClickSound();
    setRoleState(newRole);
  };

  const loginAsRider = (phone: string, session?: { token?: string; name?: string }) => {
    setIsAuthenticated(true);
    setAuthRole('rider');
    setRoleState('rider');
    setRider(prev => ({
      ...prev,
      phone: `+91 ${phone.replace(/^\+91\s?/, '')}`,
      ...(session?.name ? { name: session.name } : {}),
    }));
    if (session?.token) setStoredToken(session.token);
    if (typeof window !== 'undefined') localStorage.setItem('chalao_session_role', 'rider');
  };

  const loginAsDriver = (phone: string, session?: { token?: string; name?: string }) => {
    setIsAuthenticated(true);
    setAuthRole('driver');
    setRoleState('driver');
    const normalised = phone.replace(/[^\d]/g, '').slice(-10);
    const existing = drivers.find(d => d.phone.replace(/[^\d]/g, '').endsWith(normalised));
    if (existing) {
      setCurrentDriverId(existing.id);
    }
    if (session?.token) setStoredToken(session.token);
    if (typeof window !== 'undefined') localStorage.setItem('chalao_session_role', 'driver');
  };

  const registerDriver = (data: Partial<Driver>) => {
    const newDriverId = `d-${cityId}-${Date.now().toString().slice(-4)}`;
    const newDriver: Driver = {
      id: newDriverId,
      name: data.name || 'নতুন চালক',
      phone: data.phone || '+91 98300-00000',
      cityId,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      totalTrips: 0,
      vehicleType: data.vehicleType || 'bike',
      vehicleModel: data.vehicleModel || 'Motorbike',
      plateNumber: data.plateNumber || 'WB 02 XX 0000',
      isOnline: true,
      isBusy: false,
      isMember: true,
      memberId: `CH-IN-D${Math.floor(1000 + Math.random() * 9000)}`,
      lat: currentCity.center[0] + 0.005,
      lng: currentCity.center[1] + 0.005,
      verificationStatus: data.verificationStatus || 'pending',
      todayEarnings: 0,
      todayTrips: 0,
      patronageAccrued: 0,
      sharesOwned: data.sharesOwned || 10,
      licenseNumber: data.licenseNumber || 'DL-PENDING',
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber,
      rcNumber: data.rcNumber || 'RC-PENDING',
      upiId: data.upiId || 'driver@upi',
      walletBalance: 0
    };

    setDrivers(prev => [newDriver, ...prev]);
    setCurrentDriverId(newDriverId);
    setIsAuthenticated(true);
    setAuthRole('driver');
    setRoleState('driver');
  };

  const logout = () => {
    sound.playClickSound();
    setIsAuthenticated(false);
    setAuthRole(null);
    setStoredToken(null);
    if (typeof window !== 'undefined') localStorage.removeItem('chalao_session_role');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore an existing admin session; every API call verifies the JWT.
    if (localStorage.getItem('chalao_admin_token')) {
      setIsAdminAuthenticated(true);
    }

    // Restore a rider/driver session only when a token is present.
    const sessionRole = localStorage.getItem('chalao_session_role');
    if (getStoredToken() && (sessionRole === 'rider' || sessionRole === 'driver')) {
      setIsAuthenticated(true);
      setAuthRole(sessionRole);
      setRoleState(sessionRole);
    }
  }, []);

  const loginAsAdmin = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch(
        '/api/auth/admin-login',
        {
          method: 'POST',
          body: JSON.stringify({ username: username.trim(), password }),
        },
        'chalao_admin_token'
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.token) {
        setStoredToken(data.token, 'chalao_admin_token');
        if (typeof window !== 'undefined') localStorage.setItem('chalao_admin_auth', 'true');
        setIsAdminAuthenticated(true);
        sound.playTripStartedChime();
        return { success: true };
      }

      return {
        success: false,
        error:
          data.error ||
          (res.status === 429
            ? 'Too many attempts. Try again later.'
            : 'Invalid username or password.'),
      };
    } catch (e) {
      console.warn('Admin login request failed:', e);
      return {
        success: false,
        error: 'Could not reach the server. Check the connection and API URL.',
      };
    }
  };

  const logoutAdmin = () => {
    sound.playClickSound();
    // Clear the httpOnly cookie server-side as well as the local token.
    void apiFetch('/api/auth/admin-logout', { method: 'POST' }, 'chalao_admin_token').catch(() => {});
    setStoredToken(null, 'chalao_admin_token');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chalao_admin_auth');
    }
    setIsAdminAuthenticated(false);
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

    setTimeout(() => {
      setActiveRide(prev => {
        if (!prev || prev.id !== newRide.id || prev.status !== 'SEARCHING') return prev;
        sound.playRideOfferPing();
        return {
          ...prev,
          status: 'OFFERED'
        };
      });
    }, 1200);
  };

  const acceptRide = (driverId?: string) => {
    if (!activeRide || (activeRide.status !== 'OFFERED' && activeRide.status !== 'SEARCHING')) return;

    const targetDriver = driverId 
      ? drivers.find(d => d.id === driverId) || currentDriver 
      : currentDriver;

    sound.playTripStartedChime();
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
    if (!activeRide || activeRide.status !== 'OFFERED') return;
    sound.playClickSound();

    // With no second driver available to re-dispatch to, the honest outcome is
    // "no driver found" rather than an endless SEARCHING state.
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'CANCELLED'
      };
    });
  };

  const driverArrived = () => {
    if (!activeRide || activeRide.status !== 'ACCEPTED') return;
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
    if (!activeRide || activeRide.status !== 'ARRIVED') return false;
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
    if (!activeRide || activeRide.status !== 'ONGOING') return;
    sound.playTripCompletedFanfare();
    const completedRide = activeRide;

    if (completedRide.driver) {
      const dId = completedRide.driver.id;
      setDrivers(curr => curr.map(d => {
        if (d.id === dId) {
          return {
            ...d,
            isBusy: false,
            todayEarnings: d.todayEarnings + completedRide.driverEarnings,
            todayTrips: d.todayTrips + 1,
            walletBalance: d.walletBalance + completedRide.driverEarnings,
            patronageAccrued: d.patronageAccrued + Math.round(completedRide.platformFee * 0.30)
          };
        }
        return d;
      }));
    }

    setRider(r => ({
      ...r,
      patronagePoints: r.patronagePoints + Math.round(completedRide.fareAmount * 0.1)
    }));

    // Add to trip history
    const historyItem: TripHistoryItem = {
      id: completedRide.id,
      date: new Date().toLocaleString(),
      pickupName: completedRide.pickup.nameBn,
      dropoffName: completedRide.dropoff.nameBn,
      vehicleType: completedRide.vehicleType,
      fare: completedRide.fareAmount,
      paymentMethod: completedRide.paymentMethod.toUpperCase(),
      status: 'completed',
      driverName: completedRide.driver?.name,
      riderName: completedRide.riderName
    };

    setTripHistory(hist => [historyItem, ...hist]);

    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'COMPLETED' as const,
        completedAt: Date.now(),
        paymentStatus: 'pending' as const
      };
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

  const verifyDriverKyc = async (driverId: string, status: 'verified' | 'rejected'): Promise<boolean> => {
    sound.playClickSound();
    // Optimistic UI update
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return { ...d, verificationStatus: status };
      }
      return d;
    }));

    try {
      const res = await apiFetch('/api/admin/drivers/verify', {
        method: 'POST',
        body: JSON.stringify({ driverId, status }),
      }, 'chalao_admin_token');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchDriversFromDb();
        return true;
      }
      console.error('Driver KYC verification failed in DB:', res.status, data?.error || '');
      return false;
    } catch (e) {
      console.error('Error verifying driver KYC in DB:', e);
      return false;
    }
  };

  const requestDriverPayout = (amount: number): boolean => {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (currentDriver.walletBalance < amount) return false;
    sound.playCashPing();
    setDrivers(prev => prev.map(d => {
      if (d.id === currentDriver.id) {
        return { ...d, walletBalance: d.walletBalance - amount };
      }
      return d;
    }));
    return true;
  };

  const castVote = (motionId: string, choice: 'yes' | 'no' | 'abstain') => {
    sound.playTripStartedChime();
    setMotions(prev => prev.map(m => {
      if (m.id === motionId && m.status === 'active') {
        // If the member already voted, move their vote instead of adding a second one
        const previousVote = m.myVote;
        return {
          ...m,
          myVote: choice,
          yesVotes: m.yesVotes
            + (choice === 'yes' ? 1 : 0)
            - (previousVote === 'yes' ? 1 : 0),
          noVotes: m.noVotes
            + (choice === 'no' ? 1 : 0)
            - (previousVote === 'no' ? 1 : 0),
          abstainVotes: m.abstainVotes
            + (choice === 'abstain' ? 1 : 0)
            - (previousVote === 'abstain' ? 1 : 0)
        };
      }
      return m;
    }));
  };

  const buyShares = (count: number) => {
    sound.playTripCompletedFanfare();
    if (authRole === 'driver') {
      setDrivers(prev => prev.map(d => {
        if (d.id === currentDriver.id) {
          return { ...d, isMember: true, sharesOwned: d.sharesOwned + count };
        }
        return d;
      }));
    } else {
      setRider(prev => ({
        ...prev,
        isMember: true,
        memberId: prev.memberId || `CH-IN-M${Math.floor(1000 + Math.random() * 9000)}`,
        sharesOwned: prev.sharesOwned + count
      }));
    }
  };

  const triggerSOS = (description: string = 'Emergency SOS triggered') => {
    sound.playSOSSiren();
    const newIncident: IncidentReport = {
      id: `INC-112-${Date.now()}`,
      rideId: activeRide?.id || 'CH-SOS-MANUAL',
      reporterRole: authRole === 'driver' ? 'driver' : 'rider',
      reporterName: authRole === 'driver' ? currentDriver.name : rider.name,
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
        isAuthenticated,
        authRole,
        loginAsRider,
        loginAsDriver,
        registerDriver,
        logout,
        isAdminAuthenticated,
        loginAsAdmin,
        logoutAdmin,
        rider,
        drivers,
        currentDriver,
        activeRide,
        tripHistory,
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
        requestDriverPayout,
        castVote,
        buyShares,
        triggerSOS,
        resolveIncident,
        updatePricingRule,
        refreshDrivers: fetchDriversFromDb,
        isRefreshing,
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
