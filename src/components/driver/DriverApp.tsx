'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { getTurnByTurnDirections } from '../../services/mapService';
import { MapComponent } from '../common/MapComponent';
import { MemberPortal } from '../member/MemberPortal';
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
  ShieldCheck,
  Wallet,
  FileCheck,
  User,
  LogOut,
  SendHorizontal,
  FileText
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
    requestDriverPayout,
    getCurrencySymbol,
    currentCity,
    setRole,
    logout
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  // Driver Mobile Tab State
  const [driverTab, setDriverTab] = useState<'cockpit' | 'earnings' | 'coop' | 'profile'>('cockpit');

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [offerCountdown, setOfferCountdown] = useState(15);
  const [payoutAmount, setPayoutAmount] = useState(1000);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

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

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const success = requestDriverPayout(payoutAmount);
    if (success) {
      setPayoutSuccess(true);
      setTimeout(() => setPayoutSuccess(false), 3000);
    } else {
      alert(isBn ? 'ওয়ালেটে পর্যাপ্ত টাকা নেই!' : 'Insufficient wallet balance!');
    }
  };

  const directions = activeRide 
    ? getTurnByTurnDirections(activeRide.pickup, activeRide.dropoff, language)
    : [];

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6 space-y-4 pb-20">
      
      {/* Tab 1: Driver Cockpit */}
      {driverTab === 'cockpit' && (
        <div className="space-y-4">
          
          {/* Driver Status Card */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <img 
                src={currentDriver.photo} 
                alt={currentDriver.name} 
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/40"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs sm:text-sm">{currentDriver.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/30">
                    {isBn ? 'মালিক-চালক' : 'Driver-Owner'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  ★ {currentDriver.rating} • <span className="text-amber-300 font-mono font-bold">{currentDriver.plateNumber}</span>
                </div>
              </div>
            </div>

            {/* Online Toggle Button */}
            <button
              onClick={toggleDriverOnline}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                currentDriver.isOnline
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentDriver.isOnline ? t.driverOnline : t.driverOffline}</span>
            </button>
          </div>

          {/* Main Grid: Left HUD & Right Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Driver HUD */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Incoming Ride Request Offer Card */}
              {activeRide?.status === 'OFFERED' && (
                <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl animate-bounce-subtle">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>{t.newRideAlert}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/40">
                      {offerCountdown}s
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[10px]">{t.currentLocation}</div>
                        <div className="font-bold text-slate-100">{isBn ? activeRide.pickup.nameBn : activeRide.pickup.nameEn}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[10px]">{t.whereTo}</div>
                        <div className="font-bold text-slate-100">{isBn ? activeRide.dropoff.nameBn : activeRide.dropoff.nameEn}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-300">{isBn ? 'নিট চালক আয় (৯০-৯২%)' : 'Net Take Home'}</div>
                      <div className="text-xl font-black text-emerald-400">{currencySymbol}{activeRide.driverEarnings}</div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{currencySymbol}{activeRide.fareAmount} {isBn ? 'গ্রস' : 'gross'}</div>
                      <div className="text-teal-400">{currencySymbol}{activeRide.platformFee} {isBn ? 'ফি' : 'fee'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={declineRide}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      {t.declineOffer}
                    </button>
                    <button
                      onClick={() => acceptRide(currentDriver.id)}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5"
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
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        {activeRide.riderName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">{activeRide.riderName}</div>
                        <div className="text-[11px] text-slate-400">★ {activeRide.riderRating} • {activeRide.riderPhone}</div>
                      </div>
                    </div>

                    <a 
                      href={`tel:${activeRide.riderPhone}`}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white shadow"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  {activeRide.status === 'ACCEPTED' && (
                    <div className="space-y-3 text-center">
                      <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                        {isBn ? 'যাত্রীর পিকআপ লোকেশনে পৌঁছান' : 'Proceed to pickup'}
                      </div>
                      <button
                        onClick={driverArrived}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg"
                      >
                        {isBn ? 'পিকআপে পৌঁছে গেছি (Arrived)' : 'Arrived at Pickup'}
                      </button>
                    </div>
                  )}

                  {activeRide.status === 'ARRIVED' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-3">
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                        <label className="text-xs font-bold text-slate-300 block">
                          {t.enterOtpToStart}
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="w-40 mx-auto text-center tracking-widest text-2xl font-black bg-slate-900 border-2 border-emerald-500 rounded-xl py-2 text-emerald-300 focus:outline-none"
                        />
                        {otpError && (
                          <div className="text-[11px] text-red-400 font-semibold">
                            {isBn ? 'ভুল পিন! সঠিক কোডটি নিন।' : 'Incorrect PIN!'}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.startTripBtn}</span>
                      </button>
                    </form>
                  )}

                  {activeRide.status === 'ONGOING' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{isBn ? 'টার্ন-বাই-টার্ন নেভিগেশন' : 'Turn-by-Turn Navigation'}</span>
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
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg"
                      >
                        {t.completeTripBtn}
                      </button>
                    </div>
                  )}

                  {(activeRide.status === 'COMPLETED' || activeRide.status === 'PAID') && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/60 text-center space-y-3">
                      <div className="text-xs text-slate-300 font-semibold">{t.collectCashPrompt}</div>
                      <div className="text-3xl font-black text-emerald-400">{currencySymbol}{activeRide.fareAmount}</div>

                      <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <div>{isBn ? 'আপনার আয় (পকেটে রাখুন):' : 'Driver Net Take:'} <strong className="text-emerald-400">{currencySymbol}{activeRide.driverEarnings}</strong></div>
                        <div>{isBn ? 'সমবায় ফি:' : 'Co-op Fee:'} <strong className="text-teal-400">{currencySymbol}{activeRide.platformFee}</strong></div>
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
                          <span>{isBn ? 'পেমেন্ট সম্পন্ন হয়েছে!' : 'Payment confirmed!'}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Quick Summary Dashboard */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{isBn ? 'আজকের সংক্ষিপ্ত আয়' : "Today's Earnings"}</span>
                  <span className="text-xs text-emerald-400 font-bold">{currentDriver.todayTrips} {isBn ? 'টি ট্রিপ' : 'trips'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">{t.todayEarnings}</div>
                    <div className="text-base font-black text-white">{currencySymbol}{currentDriver.todayEarnings}</div>
                  </div>
                  <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                    <div className="text-emerald-400 text-[10px]">{t.patronageAccruedLabel}</div>
                    <div className="text-base font-black text-emerald-300">{currencySymbol}{currentDriver.patronageAccrued}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Driver GPS Map */}
            <div className="lg:col-span-7 h-[420px] sm:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-slate-800">
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
      )}

      {/* Tab 2: Earnings & Instant Payouts */}
      {driverTab === 'earnings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                {isBn ? 'আয় বিবরণী ও তাৎক্ষণিক UPI পেআউট' : 'Driver Earnings & Instant Payouts'}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              ৯০-৯২% নিট আয়
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="text-slate-400">{isBn ? 'ওয়ালেট ব্যালেন্স (পেআউটযোগ্য):' : 'Available Wallet Balance:'}</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{currencySymbol}{currentDriver.walletBalance}</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="text-slate-400">{isBn ? 'আজকের মোট আয়:' : "Today's Gross:"}</div>
              <div className="text-2xl font-black text-white mt-1">{currencySymbol}{currentDriver.todayEarnings}</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="text-slate-400">{isBn ? 'জমাকৃত প্যাট্রোনেজ বোনাস:' : 'Accrued Patronage Bonus:'}</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{currencySymbol}{currentDriver.patronageAccrued}</div>
            </div>
          </div>

          {/* Instant UPI Payout Form */}
          <form onSubmit={handleRequestPayout} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>{isBn ? 'তাৎক্ষণিক ব্যাঙ্ক / UPI পেআউট পাঠান' : 'Request Instant UPI Payout'}</span>
              </h4>
              <span className="text-slate-400 font-mono">{currentDriver.upiId || 'driver@upi'}</span>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min={100}
                max={currentDriver.walletBalance || 10000}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold whitespace-nowrap shadow"
              >
                <SendHorizontal className="w-4 h-4 inline mr-1" />
                <span>{isBn ? 'উইথড্র করুন' : 'Withdraw'}</span>
              </button>
            </div>

            {payoutSuccess && (
              <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg text-center animate-pulse">
                ✓ {isBn ? `${currencySymbol}${payoutAmount} টাকা আপনার UPI আইডিতে সফলভাবে পাঠানো হয়েছে!` : 'Payout sent successfully!'}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: Co-op Governance & Voting */}
      {driverTab === 'coop' && (
        <MemberPortal />
      )}

      {/* Tab 4: KYC & Profile */}
      {driverTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
            <img 
              src={currentDriver.photo} 
              alt={currentDriver.name} 
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <h3 className="text-base font-bold text-white">{currentDriver.name}</h3>
              <div className="text-xs text-slate-400">{currentDriver.phone} • ★ {currentDriver.rating}</div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                {currentDriver.memberId} • {currentDriver.sharesOwned} {isBn ? 'টি শেয়ার' : 'Shares'}
              </div>
            </div>
          </div>

          {/* KYC Document Records */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'যাচাইকৃত নথি ও তথ্য' : 'Verified Documents & KYC'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Commercial Driving License:</span>
                <strong className="text-white font-mono">{currentDriver.licenseNumber}</strong>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Aadhaar Card:</span>
                <strong className="text-white font-mono">{currentDriver.aadhaarNumber}</strong>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">PAN Card:</span>
                <strong className="text-white font-mono">{currentDriver.panNumber}</strong>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Vehicle RC:</span>
                <strong className="text-amber-300 font-mono">{currentDriver.plateNumber}</strong>
              </div>
            </div>
          </div>

          {/* Fatigue Warning */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
            <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{isBn ? 'চালক স্বাস্থ্য ও বিরতি পরামর্শ' : 'Driver Health Tip'}</div>
              <div className="text-[11px] text-amber-200/80 mt-0.5">{t.safetyFatigueAlert}</div>
            </div>
          </div>

          {/* Role Switcher & Logout */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => { setRole('rider'); sound.playClickSound(); }}
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <User className="w-4 h-4" />
              <span>{isBn ? 'গ্রাহক / যাত্রী অ্যাপে সুইচ করুন (Rider Mode)' : 'Switch to Rider App'}</span>
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

      {/* Fixed Mobile Bottom Navigation Bar for Driver */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => { setDriverTab('cockpit'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            driverTab === 'cockpit' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-5 h-5" />
          <span>{isBn ? 'ককপিট' : 'Drive'}</span>
        </button>

        <button
          onClick={() => { setDriverTab('earnings'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            driverTab === 'earnings' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>{isBn ? 'আয়' : 'Earnings'}</span>
        </button>

        <button
          onClick={() => { setDriverTab('coop'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            driverTab === 'coop' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>{isBn ? 'সমবায়' : 'Co-op'}</span>
        </button>

        <button
          onClick={() => { setDriverTab('profile'); sound.playClickSound(); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            driverTab === 'profile' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span>{isBn ? 'প্রোফাইল' : 'Profile'}</span>
        </button>
      </div>

    </div>
  );
};
