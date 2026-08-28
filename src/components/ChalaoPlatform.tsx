'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './common/Navbar';
import { AuthScreen } from './auth/AuthScreen';
import { RiderApp } from './rider/RiderApp';
import { DriverApp } from './driver/DriverApp';
import { MemberPortal } from './member/MemberPortal';
import { AdminPortal } from './admin/AdminPortal';
import { SafetyModal } from './safety/SafetyModal';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const ChalaoPlatform: React.FC = () => {
  const { role, language, getCurrencySymbol, currentCity, isAuthenticated } = useApp();
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  // If user is not logged in, show Auth / Onboarding Screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar onOpenSafety={() => setIsSafetyOpen(true)} />

      {/* Main Role-Based App View */}
      <main className="flex-1 py-3 sm:py-5">
        {role === 'rider' && <RiderApp onOpenSafety={() => setIsSafetyOpen(true)} />}
        {role === 'driver' && <DriverApp onOpenSafety={() => setIsSafetyOpen(true)} />}
        {role === 'member' && <MemberPortal />}
        {role === 'admin' && <AdminPortal />}
      </main>

      {/* Emergency Safety Hub Modal */}
      <SafetyModal 
        isOpen={isSafetyOpen} 
        onClose={() => setIsSafetyOpen(false)} 
      />

      {/* Cooperative Platform Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 text-slate-400 text-xs py-6 mt-8 hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xs shadow-md">
                চা
              </div>
              <div>
                <span className="font-bold text-white text-xs">চালাও • चलाओ (Chalao)</span>
                <span className="text-[10px] text-slate-500 ml-2">MSCS Act 2002 • MoRTH Compliant</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isBn ? 'স্বচ্ছ ৮-১০% সমবায় কমিশন' : '8-10% Co-op Fee'}</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBn ? '১ সদস্য, ১ ভোট' : '1 Member, 1 Vote'}</span>
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
