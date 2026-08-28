'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { CityId } from '../../types';
import { 
  Users, 
  Car, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  MapPin,
  ArrowLeftRight,
  LogOut,
  Layers
} from 'lucide-react';
import { sound } from '../../services/audioService';

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
    currentDriver,
    authRole,
    logout
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';

  const handleToggleRole = () => {
    sound.playClickSound();
    if (role === 'rider') {
      setRole('driver');
    } else if (role === 'driver') {
      setRole('rider');
    } else {
      setRole('rider');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white transition-colors shadow-lg">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/30 cursor-pointer" 
              onClick={() => setRole(authRole || 'rider')}
            >
              <span className="text-lg sm:text-xl font-black text-white">চা</span>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setRole(authRole || 'rider')}>
                <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                  {t.appName}
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {role === 'driver' ? (isBn ? 'চালক' : 'Driver') : (isBn ? 'যাত্রী' : 'Rider')}
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

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Switch Between Rider and Driver App */}
            <button
              onClick={handleToggleRole}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              title="Switch App"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>{role === 'rider' ? (isBn ? 'ড্রাইভার অ্যাপ' : 'Driver App') : (isBn ? 'গ্রাহক অ্যাপ' : 'Rider App')}</span>
            </button>

            {/* Safety SOS Quick Action */}
            <button
              onClick={onOpenSafety}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 text-xs font-bold transition-all shadow-md"
              title="National Emergency 112 / SOS Hub"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="font-bold">112</span>
            </button>

            {/* Trilingual Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-[11px] font-semibold">
              <button
                onClick={() => setLanguage('bn')}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all ${language === 'bn' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all ${language === 'hi' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all ${language === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isMuted
                  ? 'bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Admin Desk Access */}
            <button
              onClick={() => setRole('admin')}
              className="hidden md:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
              title="Admin & Operations Control Desk"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
