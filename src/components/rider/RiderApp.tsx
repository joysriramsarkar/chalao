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
  QrCode
} from 'lucide-react';

export const RiderApp: React.FC<{ onOpenSafety: () => void }> = ({ onOpenSafety }) => {
  const { 
    language, 
    rider, 
    activeRide, 
    requestRide, 
    cancelRide, 
    drivers,
    getVehicleOption,
    getCurrencySymbol,
    currentCity,
    availableLocations,
    setRole
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  // Pickups in current city
  const [pickup, setPickup] = useState<LocationPoint>(availableLocations[0] || availableLocations[0]);
  const [dropoff, setDropoff] = useState<LocationPoint>(availableLocations[1] || availableLocations[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('bike');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'wallet' | 'card'>('upi');
  const [showFareModal, setShowFareModal] = useState(false);
  const [rating, setRating] = useState(5);

  // Update locations when city changes
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
      case 'auto': return <Car className="w-5 h-5 text-amber-400" />;
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
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Top Welcome & Member Ownership Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <img 
            src={rider.photo} 
            alt={rider.name} 
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-400/50 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">{rider.name}</h2>
              {rider.isMember && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                  {isBn ? 'সমবায় অংশীদার (Member)' : isHi ? 'सहकारी सदस्य (Owner)' : 'Co-op Owner Member'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>★ {rider.rating}</span> • 
              <span className="text-emerald-400 font-semibold">{rider.patronagePoints} {isBn ? 'প্যাট্রোনেজ পয়েন্ট' : isHi ? 'पैट्रोनेज अंक' : 'Patronage Pts'}</span> • 
              <span className="text-slate-300 font-semibold">{currentCity.nameEn} ({currentCity.country})</span>
            </p>
          </div>
        </div>

        {/* Member Co-op Call to action */}
        {!rider.isMember ? (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-amber-200">{t.becomeMemberBanner}</div>
              <div className="text-slate-400 text-[11px]">{t.becomeMemberDesc}</div>
            </div>
            <button 
              onClick={() => setRole('member')}
              className="ml-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow transition-all"
            >
              {t.buyShareBtn}
            </button>
          </div>
        ) : (
          <div 
            onClick={() => setRole('member')}
            className="cursor-pointer px-3.5 py-2 rounded-xl bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/30 text-xs flex items-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-300">{isBn ? 'শেয়ার মূলধন:' : isHi ? 'शेयर पूंजी:' : 'Co-op Shares:'} </span>
              <strong className="text-emerald-300">{rider.sharesOwned} ({currencySymbol}{rider.sharesOwned * 500})</strong>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 ml-1" />
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls & Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Booking Form or Active Ride HUD */}
        <div className="lg:col-span-5 space-y-4">
          
          {!activeRide ? (
            /* Booking Interface */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur-sm">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>{isBn ? 'রাইড বুকিং ও গন্তব্য' : isHi ? 'यात्रा योजना एवं गंतव्य' : 'Plan Your Journey'}</span>
                </h3>
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  {distanceKm} km • ~{durationMin} min
                </span>
              </div>

              {/* Pickup & Destination Selectors */}
              <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
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
                    <span>{isBn ? 'স্বচ্ছ কমিশন ফর্মুলা' : isHi ? 'पारदर्शी कमीशन' : 'Transparent Formula'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
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
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
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
                          <span className="text-teal-400 font-semibold">{dynamicOpt.commissionRate * 100}% {isBn ? 'ফি' : 'fee'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector (UPI / Cash / Wallet) */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 mb-2">{t.payWith}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>UPI (GPay/PhonePe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span>{isBn ? 'নগদ ক্যাশ' : isHi ? 'नकद Cash' : 'Cash'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                      paymentMethod === 'wallet'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-teal-400" />
                    <span>{isBn ? 'কো-অপ ওয়ালেট' : isHi ? 'कोऑप वॉलेट' : 'Co-op Wallet'}</span>
                  </button>
                </div>
              </div>

              {/* Request Ride Action Button */}
              <button
                onClick={handleBook}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                <span>{t.bookRide}</span>
                <span className="bg-emerald-900/60 px-2 py-0.5 rounded-lg text-xs font-black">
                  {currencySymbol}{fareBreakdown.finalRiderPayable}
                </span>
              </button>

            </div>
          ) : (
            /* Active Ride Status HUD */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur-sm">
              
              {/* Searching State */}
              {activeRide.status === 'SEARCHING' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 animate-ping absolute" />
                    <Bike className="w-8 h-8 text-emerald-400 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{t.findingDriver}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isBn 
                        ? `নিকটবর্তী সমবায় সদস্য চালকদের (${currentCity.nameBn}) কাছে অফার পাঠানো হচ্ছে...` 
                        : isHi 
                        ? `निकटतम सहकारी ड्राइवरों (${currentCity.nameHi}) को अनुरोध भेजा जा रहा है...` 
                        : `Dispatching request to nearest cooperative drivers in ${currentCity.nameEn}...`}
                    </p>
                  </div>
                  <button
                    onClick={() => cancelRide()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                  >
                    {t.cancelRide}
                  </button>
                </div>
              )}

              {/* Offered / Driver Assigned / Arrived State */}
              {(activeRide.status === 'OFFERED' || activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-emerald-300">
                        {activeRide.status === 'ARRIVED' ? t.driverArrived : t.driverAssigned}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-200">
                      {activeRide.estimatedDurationMin} min ETA
                    </span>
                  </div>

                  {/* Driver Card */}
                  {activeRide.driver && (
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={activeRide.driver.photo} 
                            alt={activeRide.driver.name} 
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/40"
                          />
                          <div>
                            <div className="font-bold text-slate-100 text-xs sm:text-sm">{activeRide.driver.name}</div>
                            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <span>★ {activeRide.driver.rating}</span> • 
                              <span>{activeRide.driver.totalTrips} {isBn ? 'রাইড' : isHi ? 'ट्रिप' : 'rides'}</span>
                            </div>
                          </div>
                        </div>

                        <a 
                          href={`tel:${activeRide.driver.phone}`}
                          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
                        <div className="p-2 rounded-lg bg-slate-900">
                          <div className="text-slate-400">{isBn ? 'বাহন মডেল' : isHi ? 'वाहन मॉडल' : 'Vehicle'}</div>
                          <div className="font-bold text-slate-200">{activeRide.driver.vehicleModel}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900">
                          <div className="text-slate-400">{isBn ? 'নম্বর প্লেট' : isHi ? 'नंबर प्लेट' : 'Plate No.'}</div>
                          <div className="font-bold text-amber-400">{activeRide.driver.plateNumber}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OTP PIN Display for Rider */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-2 border-dashed border-emerald-500/60 text-center">
                    <div className="text-xs font-semibold text-slate-300">{t.otpForDriver}</div>
                    <div className="text-2xl font-black tracking-widest text-emerald-300 my-1">
                      {activeRide.otp}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isBn ? 'চালককে এই পিন বললে যাত্রা শুরু হবে' : isHi ? 'ड्राइवर को यह पिन बताएं ताकि यात्रा शुरू हो' : 'Give this 4-digit PIN to driver to verify & start ride'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onOpenSafety}
                      className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-400" />
                      <span>{t.safetyHub}</span>
                    </button>
                    <button
                      onClick={() => cancelRide()}
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs transition-all"
                    >
                      {t.cancelRide}
                    </button>
                  </div>
                </div>
              )}

              {/* Ongoing Journey State */}
              {activeRide.status === 'ONGOING' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/50 border border-emerald-500/50 text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{t.tripStarted}</span>
                    </div>

                    <div className="text-lg font-bold text-white">
                      {isBn 
                        ? `গন্তব্য: ${activeRide.dropoff.nameBn}` 
                        : isHi 
                        ? `गंतव्य: ${activeRide.dropoff.nameHi}` 
                        : `Heading to: ${activeRide.dropoff.nameEn}`}
                    </div>
                    <p className="text-xs text-slate-400">
                      {isBn ? 'আপনার যাত্রা নিরাপদে জিপিএস দ্বারা ট্র্যাক করা হচ্ছে' : isHi ? 'आपकी यात्रा को लाइव जीपीएस द्वारा ट्रैक किया जा रहा है' : 'GPS live tracked with cooperative safety monitoring.'}
                    </p>
                  </div>

                  {/* Live Trip Share & Emergency Actions */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={onOpenSafety}
                      className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-400" />
                      <span>112 SOS</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://chalao.coop/track/${activeRide.id}`);
                        alert(isBn ? 'লাইভ ট্র্যাকিং লিংক কপি হয়েছে!' : isHi ? 'लाइव ट्रैकिंग लिंक कॉपी हुआ!' : 'Tracking link copied!');
                      }}
                      className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{isBn ? 'ট্রিপ শেয়ার' : isHi ? 'ट्रिप साझा करें' : 'Share Trip'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Completed Journey & Receipt / Rating State */}
              {(activeRide.status === 'COMPLETED' || activeRide.status === 'PAID') && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{t.tripCompleted}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isBn ? 'আশা করি আপনার যাত্রা নিরাপদ ও আরামদায়ক ছিল!' : isHi ? 'आशा है आपकी यात्रा सुरक्षित एवं आरामदायक रही!' : 'Hope you had a safe and pleasant journey.'}
                    </p>
                  </div>

                  {/* Receipt Box */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left text-xs space-y-2">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span>{isBn ? 'রাইড ফেয়ার:' : isHi ? 'किराया:' : 'Ride Fare:'}</span>
                      <span className="text-slate-100">{currencySymbol}{activeRide.fareAmount}</span>
                    </div>
                    {activeRide.patronageRebate > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>{isBn ? 'সদস্য রিবেট ছাড়:' : isHi ? 'सदस्य छूट:' : 'Member Rebate:'}</span>
                        <span>-{currencySymbol}{activeRide.patronageRebate}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-extrabold text-sm text-emerald-400">
                      <span>{isBn ? 'পরিশোধিত টাকা:' : isHi ? 'भुगतान राशि:' : 'Paid Amount:'}</span>
                      <span>{currencySymbol}{activeRide.fareAmount} ({activeRide.paymentMethod.toUpperCase()})</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-300 font-semibold">
                      {isBn ? 'চালকের জন্য রেটিং দিন:' : isHi ? 'ड्राइवर को रेटिंग दें:' : 'Rate your driver experience:'}
                    </div>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`p-1 text-lg transition-transform hover:scale-125 ${
                            rating >= star ? 'text-amber-400' : 'text-slate-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patronage reward notification */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{isBn ? `+${Math.round(activeRide.fareAmount * 0.1)} প্যাট্রোনেজ পয়েন্ট যুক্ত হয়েছে!` : isHi ? `+${Math.round(activeRide.fareAmount * 0.1)} पैट्रोनेज अंक प्राप्त!` : `+${Math.round(activeRide.fareAmount * 0.1)} Patronage points earned!`}</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Right Column: Live Map */}
        <div className="lg:col-span-7 h-[460px] sm:h-[540px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
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
