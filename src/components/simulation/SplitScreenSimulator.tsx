'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { RiderApp } from '../rider/RiderApp';
import { DriverApp } from '../driver/DriverApp';
import { Sparkles, Users, Car } from 'lucide-react';

interface SplitScreenSimulatorProps {
  onOpenSafety: () => void;
}

export const SplitScreenSimulator: React.FC<SplitScreenSimulatorProps> = ({ onOpenSafety }) => {
  const { language, currentCity } = useApp();
  const isBn = language === 'bn';
  const isHi = language === 'hi';

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4">
      
      {/* Simulator Guidance Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 p-4 rounded-2xl border border-amber-500/40 text-center space-y-1 shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBn ? `ডুয়াল সিমুলেশন ইঞ্জিন (${currentCity.nameBn} - পাশাপাশি টেস্ট)` : isHi ? `ड्यूल सिमुलेशन मोड (${currentCity.nameHi})` : `DUAL SIMULATION ENGINE (${currentCity.nameEn})`}</span>
        </div>
        <p className="text-xs text-slate-300">
          {isBn 
            ? 'বামপাশে যাত্রী (Rider) অ্যাপ থেকে রাইড রিকোয়েস্ট পাঠান এবং ডানপাশে চালক (Driver) অ্যাপে রিয়েল-টাইম অফার গ্রহণ, ওটিপি ভেরিফিকেশন ও ট্রিপ সম্পূর্ণ করুন।' 
            : isHi 
            ? 'बाईं ओर यात्री ऐप से राइड बुक करें और दाईं ओर ड्राइवर ऐप पर लाइव ऑफर स्वीकार, ओटीपी सत्यापन एवं यात्रा पूरी करें।' 
            : 'Book a ride on the left Rider screen and watch the right Driver screen instantly receive the audio offer, accept, enter OTP, and complete the journey!'}
        </p>
      </div>

      {/* Side-by-Side Dual View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Screen: Rider View */}
        <div className="bg-slate-950/80 p-3 sm:p-4 rounded-3xl border-2 border-emerald-500/40 shadow-2xl space-y-2">
          <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-xs font-bold text-emerald-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{isBn ? 'যাত্রী স্ক্রিন (Chalao Rider)' : isHi ? 'यात्री स्क्रीन (Chalao Rider)' : 'Rider Screen'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              CLIENT APP
            </span>
          </div>

          <div className="max-h-[85vh] overflow-y-auto pr-1">
            <RiderApp onOpenSafety={onOpenSafety} />
          </div>
        </div>

        {/* Right Screen: Driver View */}
        <div className="bg-slate-950/80 p-3 sm:p-4 rounded-3xl border-2 border-amber-500/40 shadow-2xl space-y-2">
          <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-xs font-bold text-amber-400">
            <div className="flex items-center gap-1.5">
              <Car className="w-4 h-4" />
              <span>{isBn ? 'চালক স্ক্রিন (Chalao Driver)' : isHi ? 'चालक स्क्रीन (Chalao Driver)' : 'Driver Screen'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
              CO-OP DRIVER HUD
            </span>
          </div>

          <div className="max-h-[85vh] overflow-y-auto pr-1">
            <DriverApp onOpenSafety={onOpenSafety} />
          </div>
        </div>

      </div>

    </div>
  );
};
