'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { getTurnByTurnDirections } from '../../services/mapService';
import { MapComponent } from '../common/MapComponent';
import { 
  Power, 
  Car, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  Phone, 
  Coffee, 
  TrendingUp, 
  Award, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { sound } from '../../services/audioService';

export const DriverApp: React.FC<{ onOpenSafety: () => void }> = ({ onOpenSafety }) => {
  const { 
    language, 
    currentDriver, 
    activeRide, 
    toggleDriverOnline, 
    acceptRide, 
    declineRide, 
    driverArrived, 
    startTrip, 
    completeTrip, 
    confirmPaymentAndReset,
    getCurrencySymbol,
    currentCity,
    setRole
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [offerCountdown, setOfferCountdown] = useState(15);

  useEffect(() => {
    if (activeRide?.status !== 'OFFERED') {
      setOfferCountdown(15);
      return;
    }

    const interval = setInterval(() => {
      setOfferCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          declineRide();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRide?.status]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) return;

    const success = startTrip(otpInput);
    if (!success) {
      setOtpError(true);
      sound.playSOSSiren();
    } else {
      setOtpError(false);
      setOtpInput('');
    }
  };

  const directions = activeRide 
    ? getTurnByTurnDirections(activeRide.pickup, activeRide.dropoff, language)
    : [];

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Top Driver Header & Online Toggle */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <img 
            src={currentDriver.photo} 
            alt={currentDriver.name} 
            className="w-13 h-13 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">{currentDriver.name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                {isBn ? 'মালিক-চালক (সহকারী সদস্য)' : isHi ? 'मालिक-चालक (सहकारी सदस्य)' : 'Driver-Owner Member'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="text-amber-400 font-bold">★ {currentDriver.rating}</span> • 
              <span>{currentDriver.vehicleModel}</span> • 
              <span className="text-slate-300 font-mono font-bold">{currentDriver.plateNumber}</span>
            </div>
          </div>
        </div>

        {/* Online / Offline Toggle Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={toggleDriverOnline}
            className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              currentDriver.isOnline
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{currentDriver.isOnline ? t.driverOnline : t.driverOffline}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left HUD & Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Driver HUD / Ride Lifecycle */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Incoming Ride Request Offer Card */}
          {activeRide?.status === 'OFFERED' && (
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl animate-bounce-subtle">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{t.newRideAlert}</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/40">
                  {offerCountdown}s
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 text-[10px]">{t.currentLocation} (পিকআপ)</div>
                    <div className="font-bold text-slate-100">{isBn ? activeRide.pickup.nameBn : isHi ? activeRide.pickup.nameHi : activeRide.pickup.nameEn}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80">
                  <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 text-[10px]">{t.whereTo} (গন্তব্য)</div>
                    <div className="font-bold text-slate-100">{isBn ? activeRide.dropoff.nameBn : isHi ? activeRide.dropoff.nameHi : activeRide.dropoff.nameEn}</div>
                  </div>
                </div>
              </div>

              {/* Earnings & Transparent Take Home */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 p-3.5 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-300">{isBn ? 'নিট চালক আয় (৯০-৯২%)' : isHi ? 'चालक शुद्ध कमाई (९०-९२%)' : 'Net Take Home (90-92%)'}</div>
                  <div className="text-xl font-black text-emerald-400">{currencySymbol}{activeRide.driverEarnings}</div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div>{isBn ? 'মোট ফেয়ার:' : isHi ? 'कुल किराया:' : 'Gross Fare:'} {currencySymbol}{activeRide.fareAmount}</div>
                  <div className="text-teal-400">{isBn ? 'সমবায় ফি:' : isHi ? 'सहकारी शुल्क:' : 'Co-op Fee:'} {currencySymbol}{activeRide.platformFee}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={declineRide}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  {t.declineOffer}
                </button>
                <button
                  onClick={() => acceptRide(currentDriver.id)}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.acceptOffer}</span>
                </button>
              </div>

            </div>
          )}

          {/* Active Trip Navigation Screen */}
          {activeRide && activeRide.status !== 'OFFERED' && activeRide.status !== 'SEARCHING' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              
              {/* Passenger Info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    {activeRide.riderName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-xs sm:text-sm">{activeRide.riderName}</div>
                    <div className="text-[11px] text-slate-400">★ {activeRide.riderRating} • {activeRide.riderPhone}</div>
                  </div>
                </div>

                <a 
                  href={`tel:${activeRide.riderPhone}`}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* State 1: ACCEPTED -> Heading to Pickup */}
              {activeRide.status === 'ACCEPTED' && (
                <div className="space-y-3 text-center">
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                    {isBn ? 'যাত্রীর পিকআপ লোকেশনে পৌঁছান' : isHi ? 'यात्री के पिकअप स्थल पर पहुंचे' : 'Proceed to passenger pickup location'}
                  </div>
                  <button
                    onClick={driverArrived}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all"
                  >
                    {isBn ? 'পিকআপে পৌঁছে গেছি (Arrived)' : isHi ? 'पिकअप पर पहुँच गए (Arrived)' : 'Arrived at Pickup Point'}
                  </button>
                </div>
              )}

              {/* State 2: ARRIVED -> Verify OTP */}
              {activeRide.status === 'ARRIVED' && (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      {t.enterOtpToStart}
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="XXXX"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-40 mx-auto text-center tracking-widest text-2xl font-black bg-slate-900 border-2 border-emerald-500 rounded-xl py-2 text-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
                    />
                    {otpError && (
                      <div className="text-[11px] text-red-400 font-semibold">
                        {isBn ? 'ভুল পিন! যাত্রীর স্ক্রিনের ৪-সংখ্যার কোডটি নিন।' : isHi ? 'गलत पिन! यात्री से सही ४-अंकीय कोड प्राप्त करें।' : 'Incorrect PIN! Ask passenger for correct 4-digit code.'}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.startTripBtn}</span>
                  </button>
                </form>
              )}

              {/* State 3: ONGOING -> Turn-by-Turn Directions & Complete Trip */}
              {activeRide.status === 'ONGOING' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isBn ? 'টার্ন-বাই-টার্ন নেভিগেশন' : isHi ? 'टर्न-बाय-टर्न नेविगेशन' : 'Turn-by-Turn Navigation'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300 max-h-32 overflow-y-auto">
                      {directions.map((dir, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{dir}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={completeTrip}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-all"
                  >
                    {t.completeTripBtn}
                  </button>
                </div>
              )}

              {/* State 4: COMPLETED / Collect Payment */}
              {(activeRide.status === 'COMPLETED' || activeRide.status === 'PAID') && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/60 text-center space-y-3">
                  <div className="text-xs text-slate-300 font-semibold">{t.collectCashPrompt}</div>
                  <div className="text-3xl font-black text-emerald-400">{currencySymbol}{activeRide.fareAmount}</div>

                  <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div>{isBn ? 'আপনার আয় (পকেটে রাখুন):' : isHi ? 'आपकी कमाई:' : 'Driver Net Take:'} <strong className="text-emerald-400">{currencySymbol}{activeRide.driverEarnings}</strong></div>
                    <div>{isBn ? 'সমবায় ফান্ডে কর্তন (৮-১০%):' : isHi ? 'सहकारी शुल्क:' : 'Co-op Fee:'} <strong className="text-teal-400">{currencySymbol}{activeRide.platformFee}</strong></div>
                  </div>

                  {activeRide.status === 'COMPLETED' ? (
                    <button
                      onClick={confirmPaymentAndReset}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all"
                    >
                      {t.cashCollectedConfirm}
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>{isBn ? 'লেনদেন সম্পন্ন হয়েছে!' : isHi ? 'भुगतान सफल!' : 'Payment confirmed! Ready for next ride.'}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Driver Earnings & Co-op Stats Dashboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{isBn ? 'আজকের সমবায় আয় বিবরণী' : isHi ? 'आज की कमाई लेजर' : "Today's Earnings & Ledger"}</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-bold">{currentDriver.todayTrips} {isBn ? 'টি ট্রিপ' : isHi ? 'ट्रिप' : 'trips'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">{t.todayEarnings}</div>
                <div className="text-lg font-black text-white">{currencySymbol}{currentDriver.todayEarnings}</div>
              </div>

              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 font-semibold">{t.patronageAccruedLabel}</div>
                <div className="text-lg font-black text-emerald-300">{currencySymbol}{currentDriver.patronageAccrued}</div>
              </div>
            </div>

            {/* Co-op Ownership Perks */}
            <div 
              onClick={() => setRole('member')}
              className="cursor-pointer p-3 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/40 rounded-xl border border-emerald-500/30 hover:border-emerald-400 transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">{isBn ? 'সমবায় শেয়ার ও মালিকানা' : isHi ? 'सहकारी शेयर एवं स्वामित्व' : 'Co-op Share Capital'}</div>
                  <div className="text-[11px] text-slate-400">
                    {currentDriver.sharesOwned} {isBn ? `টি শেয়ার (${currencySymbol}${currentDriver.sharesOwned * 500})` : `${currentDriver.sharesOwned} Shares (${currencySymbol}${currentDriver.sharesOwned * 500})`}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Fatigue Warning */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <Coffee className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <div className="font-bold">{isBn ? 'চালক ক্লান্তি ও স্বাস্থ্য সচেতনতা' : isHi ? 'चालक थकान एवं स्वास्थ्य अलर्ट' : 'Driver Fatigue Alert'}</div>
                <div className="text-[11px] text-amber-200/80 mt-0.5">{t.safetyFatigueAlert}</div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Driver Live GPS Map */}
        <div className="lg:col-span-7 h-[460px] sm:h-[540px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          <MapComponent 
            pickup={activeRide?.pickup}
            dropoff={activeRide?.dropoff}
            routePolyline={activeRide?.routePolyline}
            currentPos={activeRide?.currentPos}
            drivers={[currentDriver]}
            showDrivers={true}
            centerCoords={currentCity.center}
          />
        </div>

      </div>

    </div>
  );
};
