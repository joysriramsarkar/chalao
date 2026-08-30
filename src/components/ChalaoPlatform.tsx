'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './common/Navbar';
import { AdminPortal } from './admin/AdminPortal';
import { AdminAuthScreen } from './admin/AdminAuthScreen';
import { SafetyModal } from './safety/SafetyModal';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const ChalaoPlatform: React.FC = () => {
  const { language, refreshDrivers, isRefreshing, isAdminAuthenticated, logoutAdmin } = useApp();
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const isBn = language === 'bn';

  if (!isAdminAuthenticated) {
    return <AdminAuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Admin Operations Bar */}
      <Navbar 
        onOpenSafety={() => setIsSafetyOpen(true)} 
        onRefresh={() => refreshDrivers()} 
        isRefreshing={isRefreshing}
        onLogout={logoutAdmin}
        isAdmin={true}
      />

      {/* Main Admin Management Suite */}
      <main className="flex-1 py-4 sm:py-6">
        <AdminPortal />
      </main>

      {/* Emergency Safety Hub Modal */}
      <SafetyModal 
        isOpen={isSafetyOpen} 
        onClose={() => setIsSafetyOpen(false)} 
      />

      {/* Cooperative Platform Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 text-slate-400 text-xs py-5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xs shadow-md">
              চা
            </div>
            <div>
              <span className="font-bold text-white text-xs">চালাও সমবায় সেন্ট্রাল অ্যাডমিন (Chalao Co-op Admin)</span>
              <span className="text-[10px] text-slate-500 ml-2">MSCS Act 2002 • MoRTH Compliant</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isBn ? 'স্বচ্ছ ৮-১০% সমবায় প্ল্যাটফর্ম ফি' : '8-10% Co-op Platform Fee'}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'Neon PostgreSQL লাইভ ডাটাবেস' : 'Neon PostgreSQL Live DB'}</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
