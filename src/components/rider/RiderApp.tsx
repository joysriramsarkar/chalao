'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { VEHICLE_OPTIONS } from '../../data/initialState';
import { LocationPoint, VehicleType } from '../../types';
import { calculateDistanceKm, estimateDurationMin } from '../../services/mapService';
import { calculateFare } from '../../services/coopEngine';
import { MapComponent } from '../common/MapComponent';
import { FareBreakdownModal } from '../common/FareBreakdownModal';
import { MemberPortal } from '../member/MemberPortal';
import { 
  MapPin, 
  Navigation, 
  Bike, 
  Car, 
  HeartHandshake, 
  Users, 
  Leaf, 
  ShieldCheck, 
  Info, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  Banknote,
  Smartphone,
  Share2,
  ArrowRight,
  QrCode,
  History,
  Award,
  User,
  LogOut,
  CarFront,
  Clock,
  Home,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { sound } from '../../services/audioService';

export const RiderApp: React.FC<{ onOpenSafety: () => void }> = ({ onOpenSafety }) => {
  const { 
    language, 
    rider, 
    activeRide, 
    requestRide, 
    cancelRide, 
    drivers,
    tripHistory,
    getVehicleOption,
    getCurrencySymbol,
    currentCity,
    availableLocations,
    setRole,
    logout
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  // Mobile Bottom Tab State
  const [mobileTab, setMobileTab] = useState<'ride' | 'trips' | 'coop' | 'profile'>('ride');

  // Booking State
  const [pickup, setPickup] = useState<LocationPoint>(availableLocations[0] || availableLocations[0]);
  const [dropoff, setDropoff] = useState<LocationPoint>(availableLocations[1] || availableLocations[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('bike');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'wallet' | 'card'>('upi');
  const [showFareModal, setShowFareModal] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (availableLocations.length >= 2) {
      setPickup(availableLocations[0]);
      setDropoff(availableLocations[1]);
    } else if (availableLocations.length === 1) {
      setPickup(availableLocations[0]);
      setDropoff(availableLocations[0]);
    }
  }, [currentCity.id, availableLocations]);

  const vehicleOpt = getVehicleOption(selectedVehicle);
  const distanceKm = pickup && dropoff ? calculateDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 3.5;
  const durationMin = estimateDurationMin(distanceKm);
  const fareBreakdown = calculateFare(vehicleOpt, distanceKm, durationMin, rider.isMember);

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'bike': return <Bike className="w-5 h-5 text-emerald-400" />;
      case 'auto': return <CarFront className="w-5 h-5 text-amber-400" />;
      case 'car': return <Car className="w-5 h-5 text-sky-400" />;
      case 'pink': return <HeartHandshake className="w-5 h-5 text-pink-400" />;
      case 'share': return <Users className="w-5 h-5 text-purple-400" />;
      case 'green': return <Leaf className="w-5 h-5 text-emerald-400" />;
    }
  };

  const handleBook = () => {
    if (!pickup || !dropoff) return;
    requestRide(pickup, dropoff, selectedVehicle, paymentMethod);
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6 space-y-4 pb-20">
      
      {/* Tab 1: Book Ride Main Screen */}
      {mobileTab === 'ride' && (
        <div className="space-y-4">
          
          {/* Top Member Ownership Pill */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <img 
                src={rider.photo} 
                alt={rider.name} 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/40"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs sm:text-sm">{rider.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/30">
                    {rider.isMember ? (isBn ? 'সমবায় মালিক' : 'Owner Member') : (isBn ? 'যাত্রী' : 'Rider')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentCity.nameEn} • {rider.patronagePoints} {isBn ? 'পয়েন্ট' : 'pts'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileTab('coop')}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1 hover:bg-emerald-900/60 transition-all"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{rider.sharesOwned} {isBn ? 'টি শেয়ার' : 'Shares'}</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Left Controls & Right Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Booking HUD */}
            <div className="lg:col-span-5 space-y-4">
              
              {!activeRide ? (
                /* Booking Form */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span>{isBn ? 'কোথায় যাবেন?' : 'Where to?'}</span>
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                      {distanceKm} km • ~{durationMin} min
                    </span>
                  </div>

                  {/* Pickup & Destination Selectors */}
                  <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{t.currentLocation}</span>
                      </label>
                      <select 
                        value={pickup?.id}
                        onChange={(e) => {
                          const found = availableLocations.find(l => l.id === e.target.value);
                          if (found) setPickup(found);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                      >
                        {availableLocations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {isBn ? loc.nameBn : isHi ? loc.nameHi : loc.nameEn} ({isBn ? loc.areaBn : isHi ? loc.areaHi : loc.areaEn})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{t.whereTo}</span>
                      </label>
                      <select 
                        value={dropoff?.id}
                        onChange={(e) => {
                          const found = availableLocations.find(l => l.id === e.target.value);
                          if (found) setDropoff(found);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                      >
                        {availableLocations.filter(l => l.id !== pickup?.id).map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {isBn ? loc.nameBn : isHi ? loc.nameHi : loc.nameEn} ({isBn ? loc.areaBn : isHi ? loc.areaHi : loc.areaEn})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vehicle Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">{t.recommendedVehicles}</span>
                      <button 
                        onClick={() => setShowFareModal(true)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>{isBn ? 'স্বচ্ছ ৮-১০% কমিশন' : '8-10% Co-op Fee'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {VEHICLE_OPTIONS.map(v => {
                        const dynamicOpt = getVehicleOption(v.id);
                        const fare = calculateFare(dynamicOpt, distanceKm, durationMin, rider.isMember);
                        const isSelected = selectedVehicle === v.id;

                        return (
                          <div
                            key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/30'
                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                {getVehicleIcon(v.id)}
                              </div>
                              <span className="text-xs font-bold text-emerald-400">
                                {currencySymbol}{fare.finalRiderPayable}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-100 truncate">
                              {isBn ? v.nameBn : isHi ? v.nameHi : v.nameEn}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                              <span>{v.etaMin} min ETA</span>
                              <span className="text-teal-400 font-semibold">{dynamicOpt.commissionRate * 100}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">{t.payWith}</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                          paymentMethod === 'upi'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>UPI (GPay)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                          paymentMethod === 'cash'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-400" />
                        <span>{isBn ? 'নগদ ক্যাশ' : 'Cash'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                          paymentMethod === 'wallet'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-teal-400" />
                        <span>{currencySymbol}{rider.walletBalance}</span>
                      </button>
                    </div>
                  </div>

                  {/* Request Ride Action Button */}
                  <button
                    onClick={handleBook}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    <span>{t.bookRide}</span>
                    <span className="bg-emerald-900/60 px-2 py-0.5 rounded-lg text-xs font-black">
                      {currencySymbol}{fareBreakdown.finalRiderPayable}
                    </span>
                  </button>

                </div>
              ) : (
                /* Active Ride Live Screen */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                  
                  {activeRide.status === 'SEARCHING' && (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center relative">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 animate-ping absolute" />
                        <Bike className="w-6 h-6 text-emerald-400 animate-bounce" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{t.findingDriver}</h3>
                      <button
                        onClick={() => cancelRide()}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                      >
                        {t.cancelRide}
                      </button>
                    </div>
                  )}

                  {(activeRide.status === 'OFFERED' || activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-bold text-emerald-300">
                        <span>{activeRide.status === 'ARRIVED' ? t.driverArrived : t.driverAssigned}</span>
                        <span>{activeRide.estimatedDurationMin} min ETA</span>
                      </div>

                      {activeRide.driver && (
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={activeRide.driver.photo} 
                              alt={activeRide.driver.name} 
                              className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/40"
                            />
                            <div>
                              <div className="font-bold text-white text-xs">{activeRide.driver.name}</div>
                              <div className="text-[11px] text-emerald-400">★ {activeRide.driver.rating} • {activeRide.driver.vehicleModel}</div>
                              <div className="text-[11px] text-amber-300 font-mono font-bold">{activeRide.driver.plateNumber}</div>
                            </div>
                          </div>

                          <a 
                            href={`tel:${activeRide.driver.phone}`}
                            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {/* 4-digit PIN OTP Display */}
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border-2 border-dashed border-emerald-500/60 text-center">
                        <div className="text-xs font-semibold text-slate-300">{t.otpForDriver}</div>
                        <div className="text-2xl font-black tracking-widest text-emerald-300 my-1 font-mono">
                          {activeRide.otp}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={onOpenSafety}
                          className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-4 h-4 text-red-400" />
                          <span>112 SOS</span>
                        </button>
                        <button
                          onClick={() => cancelRide()}
                          className="py-2 px-4 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs"
                        >
                          {t.cancelRide}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeRide.status === 'ONGOING' && (
                    <div className="space-y-4 text-center">
                      <div className="p-4 bg-emerald-950/60 rounded-xl border border-emerald-500/50 space-y-1">
                        <div className="text-xs font-bold text-emerald-300">
                          {t.tripStarted}
                        </div>
                        <div className="text-base font-bold text-white">
                          {activeRide.dropoff.nameBn}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={onOpenSafety}
                          className="p-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>112 SOS</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://chalao.coop/track/${activeRide.id}`);
                            alert(isBn ? 'লাইভ ট্র্যাকিং লিংক কপি হয়েছে!' : 'Tracking link copied!');
                          }}
                          className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>{isBn ? 'ট্রিপ শেয়ার' : 'Share Trip'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {(activeRide.status === 'COMPLETED' || activeRide.status === 'PAID') && (
                    <div className="space-y-4 text-center py-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/50">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{t.tripCompleted}</h3>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between font-extrabold text-emerald-400">
                        <span>{isBn ? 'পরিশোধিত ভাড়া:' : 'Paid Fare:'}</span>
                        <span>{currencySymbol}{activeRide.fareAmount} ({activeRide.paymentMethod.toUpperCase()})</span>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Right Column: Live GPS Map */}
            <div className="lg:col-span-7 h-[420px] sm:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-slate-800">
              <MapComponent 
                pickup={activeRide ? activeRide.pickup : pickup}
                dropoff={activeRide ? activeRide.dropoff : dropoff}
                routePolyline={activeRide?.routePolyline}
                currentPos={activeRide?.currentPos}
                drivers={drivers}
                showDrivers={true}
                centerCoords={currentCity.center}
              />
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: My Trips & Receipts */}
      {mobileTab === 'trips' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                {isBn ? 'আমার সম্পন্ন ট্রিপ হিস্ট্রি' : 'My Trip History'}
              </h3>
            </div>
            <span className="text-xs text-slate-400">{tripHistory.length} {isBn ? 'টি ট্রিপ' : 'trips'}</span>
          </div>

          <div className="space-y-3">
            {tripHistory.map(trip => (
              <div key={trip.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">{trip.id}</span>
                  <span className="text-slate-400 text-[11px]">{trip.date}</span>
                </div>
                <div className="text-slate-200">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {trip.pickupName}</div>
                  <div className="flex items-center gap-1.5 mt-1"><Navigation className="w-3.5 h-3.5 text-amber-400" /> {trip.dropoffName}</div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-bold">
                  <span className="text-slate-400">{trip.driverName || 'চালকের নাম'}</span>
                  <span className="text-emerald-400 text-sm">{currencySymbol}{trip.fare} ({trip.paymentMethod})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Member Portal (Co-op Ownership & Voting) */}
      {mobileTab === 'coop' && (
        <MemberPortal />
      )}

      {/* Tab 4: Profile & Saved Places */}
      {mobileTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
            <img 
              src={rider.photo} 
              alt={rider.name} 
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <h3 className="text-base font-bold text-white">{rider.name}</h3>
              <div className="text-xs text-slate-400">{rider.phone} • ★ {rider.rating}</div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                {rider.memberId} • {rider.sharesOwned} {isBn ? 'টি শেয়ার' : 'Shares'}
              </div>
            </div>
          </div>

          {/* Saved Places */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{isBn ? 'সংরক্ষিত ঠিকানা সমূহ (Saved Places)' : 'Saved Places'}</h4>
            <div className="space-y-2 text-xs">
              {rider.savedPlaces?.map(sp => (
                <div key={sp.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {sp.label.includes('বাড়ি') || sp.label.includes('Home') ? <Home className="w-4 h-4 text-emerald-400" /> : <Briefcase className="w-4 h-4 text-amber-400" />}
                    <div>
                      <div className="font-bold text-white">{sp.label}</div>
                      <div className="text-[11px] text-slate-400">{sp.address}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Role Switcher & Logout */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => { setRole('driver'); sound.playClickSound(); }}
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Car className="w-4 h-4" />
              <span>{isBn ? 'ড্রাইভার অ্যাপে সুইচ করুন (Driver Mode)' : 'Switch to Driver App'}</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>{isBn ? 'লগআউট করুন' : 'Log Out'}</span>
            </button>
          </div>

        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => { setMobileTab('ride'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            mobileTab === 'ride' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-5 h-5" />
          <span>{isBn ? 'রাইড' : 'Ride'}</span>
        </button>

        <button
          onClick={() => { setMobileTab('trips'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            mobileTab === 'trips' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          <span>{isBn ? 'ট্রিপস' : 'Trips'}</span>
        </button>

        <button
          onClick={() => { setMobileTab('coop'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            mobileTab === 'coop' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>{isBn ? 'সমবায়' : 'Co-op'}</span>
        </button>

        <button
          onClick={() => { setMobileTab('profile'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            mobileTab === 'profile' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span>{isBn ? 'প্রোফাইল' : 'Profile'}</span>
        </button>
      </div>

      {/* Fare Transparency Breakdown Modal */}
      <FareBreakdownModal 
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
        fare={fareBreakdown}
        vehicle={vehicleOpt}
        language={language}
        currencySymbol={currencySymbol}
      />

    </div>
  );
};
