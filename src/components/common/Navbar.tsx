'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { CityId } from '../../types';
import { 
  Users, 
  Car, 
  Vote, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Globe, 
  Layers, 
  Sparkles,
  MapPin
} from 'lucide-react';

interface NavbarProps {
  onOpenSafety: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSafety }) => {
  const { 
    role, 
    setRole, 
    language, 
    setLanguage, 
    currentCity, 
    setCityId, 
    availableCities, 
    getCurrencySymbol,
    isMuted, 
    setIsMuted, 
    rider, 
    motions 
  } = useApp();

  const t = TRANSLATIONS[language];
  const activeMotionsCount = motions.filter(m => m.status === 'active' && !m.myVote).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/30 cursor-pointer" 
              onClick={() => setRole('rider')}
            >
              <span className="text-xl font-black tracking-tighter text-white">চা</span>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setRole('rider')}>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                  {t.appName}
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  CO-OP • {getCurrencySymbol()}
                </span>
              </div>

              {/* City Switcher Pill */}
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <select
                  value={currentCity.id}
                  onChange={(e) => setCityId(e.target.value as CityId)}
                  className="bg-transparent text-[11px] font-bold text-slate-300 hover:text-emerald-300 focus:outline-none cursor-pointer"
                >
                  {availableCities.map(city => (
                    <option key={city.id} value={city.id} className="bg-slate-900 text-white">
                      {language === 'bn' ? city.nameBn : language === 'hi' ? city.nameHi : city.nameEn} ({city.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setRole('rider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'rider'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {t.roleRider}
            </button>

            <button
              onClick={() => setRole('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'driver'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              {t.roleDriver}
            </button>

            <button
              onClick={() => setRole('member')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold relative transition-all ${
                role === 'member'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              {t.roleMember}
              {activeMotionsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => setRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {t.roleAdmin}
            </button>

            <button
              onClick={() => setRole('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'simulator'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-900/30'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.roleSimulator}
            </button>
          </nav>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Safety SOS Quick Action */}
            <button
              onClick={onOpenSafety}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 text-xs font-bold transition-all animate-pulse-subtle shadow-lg shadow-red-950/40"
              title="National Emergency 112 / SOS Hub"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline font-bold">112 SOS</span>
            </button>

            {/* Trilingual Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setLanguage('bn')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'bn' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'hi' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isMuted
                  ? 'bg-slate-800/50 text-slate-500 border-slate-700'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Member Badge */}
            {rider.isMember && (
              <div 
                onClick={() => setRole('member')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer hover:border-emerald-400 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
                <span>{rider.memberId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-800/60 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setRole('rider')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium ${
              role === 'rider' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            {t.roleRider}
          </button>
          <button
            onClick={() => setRole('driver')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium ${
              role === 'driver' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            {t.roleDriver}
          </button>
          <button
            onClick={() => setRole('member')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium ${
              role === 'member' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            {t.roleMember}
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium ${
              role === 'admin' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            {t.roleAdmin}
          </button>
          <button
            onClick={() => setRole('simulator')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-bold ${
              role === 'simulator' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'
            }`}
          >
            {t.roleSimulator}
          </button>
        </div>
      </div>
    </header>
  );
};
