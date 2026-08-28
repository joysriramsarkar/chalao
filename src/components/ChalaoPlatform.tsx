'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './common/Navbar';
import { RiderApp } from './rider/RiderApp';
import { DriverApp } from './driver/DriverApp';
import { MemberPortal } from './member/MemberPortal';
import { AdminPortal } from './admin/AdminPortal';
import { SplitScreenSimulator } from './simulation/SplitScreenSimulator';
import { SafetyModal } from './safety/SafetyModal';
import { ShieldCheck, Heart, Sparkles, Landmark } from 'lucide-react';

export const ChalaoPlatform: React.FC = () => {
  const { role, language, getCurrencySymbol, currentCity } = useApp();
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar onOpenSafety={() => setIsSafetyOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 py-4 sm:py-6">
        {role === 'rider' && <RiderApp onOpenSafety={() => setIsSafetyOpen(true)} />}
        {role === 'driver' && <DriverApp onOpenSafety={() => setIsSafetyOpen(true)} />}
        {role === 'member' && <MemberPortal />}
        {role === 'admin' && <AdminPortal />}
        {role === 'simulator' && <SplitScreenSimulator onOpenSafety={() => setIsSafetyOpen(true)} />}
      </main>

      {/* Emergency Safety Hub Modal */}
      <SafetyModal 
        isOpen={isSafetyOpen} 
        onClose={() => setIsSafetyOpen(false)} 
      />

      {/* Cooperative Platform Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 text-slate-400 text-xs py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-sm shadow-md">
                চা
              </div>
              <div>
                <span className="font-bold text-white text-sm">চালাও • चलाओ (Chalao)</span>
                <span className="text-[11px] text-slate-500 ml-2">Multi-State Cooperative Society Ltd. (MSCS Act, 2002)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{isBn ? 'স্বচ্ছ ৮-১০% কমিশন' : isHi ? 'पारदर्शी ८-१०% कमीशन' : '8-10% Co-op Fee'}</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>{isBn ? '১ সদস্য, ১ ভোট' : isHi ? '१ सदस्य, १ वोट' : '1 Member, 1 Vote'}</span>
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <Heart className="w-4 h-4" />
                <span>{isBn ? 'চালক-যাত্রী যৌথ মালিকানা' : isHi ? 'चालक-यात्री संयुक्त स्वामित्व' : 'Shared Ownership'}</span>
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 Chalao Cooperative Society Ltd. • {isBn ? 'সর্বস্বত্ব সংরক্ষিত।' : isHi ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'} (Kolkata • Delhi NCR • Mumbai • Bengaluru • Dhaka)
            </div>
            <div className="flex items-center gap-3">
              <span>{currentCity.nameEn} ({currentCity.country})</span>
              <span>•</span>
              <span>MoRTH & Co-op Bylaws</span>
              <span>•</span>
              <span>Emergency: {currentCity.emergencyNumber}</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
