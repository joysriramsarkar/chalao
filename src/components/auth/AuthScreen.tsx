'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { VehicleType, CityId } from '../../types';
import { 
  Users, 
  Car, 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  CreditCard,
  MapPin
} from 'lucide-react';
import { sound } from '../../services/audioService';

export const AuthScreen: React.FC = () => {
  const { 
    language, 
    loginAsRider, 
    loginAsDriver, 
    registerDriver, 
    currentCity, 
    availableCities,
    getCurrencySymbol
  } = useApp();

  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  const [selectedRole, setSelectedRole] = useState<'rider' | 'driver'>('rider');
  const [step, setStep] = useState<'phone' | 'otp' | 'driver_kyc'>('phone');
  const [phone, setPhone] = useState('98300-99887');
  const [otp, setOtp] = useState('1234');
  const [otpSent, setOtpSent] = useState(false);

  // Driver KYC Form Fields
  const [driverName, setDriverName] = useState('শুভাশিস রায় (Subhashish Roy)');
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleModel, setVehicleModel] = useState('Hero Splendor Plus (Black)');
  const [plateNumber, setPlateNumber] = useState('WB 02 AB 4589');
  const [licenseNumber, setLicenseNumber] = useState('WB02-20180019241');
  const [aadhaarNumber, setAadhaarNumber] = useState('9821-4451-8912');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [upiId, setUpiId] = useState('subhashish@oksbi');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    sound.playClickSound();
    setOtpSent(true);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTripStartedChime();

    if (selectedRole === 'rider') {
      loginAsRider(phone);
    } else {
      // If driver is registering or logging in
      loginAsDriver(phone);
    }
  };

  const handleCompleteDriverKyc = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTripCompletedFanfare();
    registerDriver({
      name: driverName,
      phone: `+91 ${phone}`,
      cityId: currentCity.id,
      vehicleType,
      vehicleModel,
      plateNumber,
      licenseNumber,
      aadhaarNumber,
      panNumber,
      rcNumber: `RC-${Date.now().toString().slice(-6)}`,
      upiId,
      sharesOwned: 10
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white animate-fade-in selection:bg-emerald-500">
      
      {/* Branding Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 flex items-center justify-center shadow-2xl shadow-emerald-950/80 ring-4 ring-emerald-400/30">
          <span className="text-3xl font-black text-white">চা</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
          চালাও • चलाओ (Chalao)
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {isBn ? '“যারা চালায়, যারা চড়ে, তারাই মালিক।” — গণতান্ত্রিক সমবায় প্ল্যাটফর্ম' : '“Those who drive, those who ride, are the owners.”'}
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl backdrop-blur-md space-y-5">
        
        {/* Role Toggle Tabs */}
        {step !== 'driver_kyc' && (
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setSelectedRole('rider'); sound.playClickSound(); }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'rider'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isBn ? 'গ্রাহক / যাত্রী (Rider)' : isHi ? 'सवारी (Rider)' : 'Rider App'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRole('driver'); sound.playClickSound(); }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'driver'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{isBn ? 'চালক / পার্টনার (Driver)' : isHi ? 'चालक (Driver)' : 'Driver App'}</span>
            </button>
          </div>
        )}

        {/* Step 1: Phone Number Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isBn ? 'আপনার মোবাইল নম্বর লিখুন:' : isHi ? 'अपना मोबाइल नंबर दर्ज करें:' : 'Enter Mobile Number:'}</span>
              </label>

              <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-950 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30">
                <span className="px-3 py-2.5 text-xs font-bold bg-slate-800 text-emerald-400 border-r border-slate-700 flex items-center">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98300-XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {isBn ? 'লগইন ও ভেরিফিকেশনের জন্য ৪-সংখ্যার ওটিপি পাঠানো হবে' : 'We will send a 4-digit verification code.'}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              <span>{isBn ? 'ওটিপি (OTP) পাঠান' : isHi ? 'ओटीपी भेजें' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {selectedRole === 'driver' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('driver_kyc')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-emerald-500/50"
                >
                  {isBn ? 'নতুন চালক? লাইসেন্স ও আধার দিয়ে সরাসরি নিবন্ধন করুন' : 'New Driver? Register with DL & Aadhaar'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Step 2: OTP Verification Screen */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
            <div className="space-y-1">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {isBn ? 'ওটিপি যাচাইকরণ (OTP Verification)' : 'Enter 4-Digit Code'}
              </h3>
              <p className="text-xs text-slate-400">
                +91 {phone} নম্বরে ৪-সংখ্যার কোড পাঠানো হয়েছে
              </p>
            </div>

            <div className="py-2">
              <input
                type="text"
                maxLength={4}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-40 mx-auto text-center tracking-widest text-2xl font-black bg-slate-950 border-2 border-emerald-500 rounded-2xl py-2.5 text-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isBn ? 'যাচাই ও প্রবেশ করুন' : 'Verify & Enter App'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-xs text-slate-400 hover:text-slate-200 underline block mx-auto pt-1"
              >
                {isBn ? 'মোবাইল নম্বর পরিবর্তন করুন' : 'Change mobile number'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Driver KYC & Commercial Onboarding Wizard */}
        {step === 'driver_kyc' && (
          <form onSubmit={handleCompleteDriverKyc} className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  {isBn ? 'ড্রাইভার-মালিক সমবায় অনবোর্ডিং' : 'Driver-Owner KYC Registration'}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                MSCS Act 2002
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {isBn ? 'পূর্ণ নাম (আধার অনুযায়ী):' : 'Full Name (as on Aadhaar):'}
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {isBn ? 'বাহন ক্যাটাগরি:' : 'Vehicle Category:'}
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="bike">চালাও বাইক (Bike)</option>
                  <option value="auto">চালাও অটো (CNG/EV)</option>
                  <option value="car">প্রাইম সেডান (Sedan)</option>
                  <option value="pink">চালাও পিংক (নারী-সুরক্ষিত)</option>
                  <option value="green">চালাও গ্রিন (EV)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {isBn ? 'গাড়ির নম্বর প্লেট:' : 'Plate Number:'}
                </label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {isBn ? 'কমার্শিয়াল ড্রাইভিং লাইসেন্স (DL):' : 'Commercial DL No:'}
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {isBn ? 'আধার নম্বর (Aadhaar):' : 'Aadhaar Card No:'}
                </label>
                <input
                  type="text"
                  required
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                <span>{isBn ? 'দৈনিক পেআউটের জন্য UPI আইডি:' : 'Payout UPI ID (GPay/PhonePe):'}</span>
                <span className="text-emerald-400 text-[10px]">৯০-৯২% নিশ্চিত আয়</span>
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isBn ? 'অনবোর্ডিং সম্পন্ন ও ককপিট চালু' : 'Complete KYC & Enter Driver Cockpit'}</span>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Footer Cooperative Trust Badge */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Multi-State Co-operative Societies Act 2002 • MoRTH Compliant</span>
      </div>

    </div>
  );
};
