'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  CheckCircle2,
  Volume2,
  VolumeX,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { sound } from '../../services/audioService';

export const AdminAuthScreen: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    loginAsAdmin, 
    isMuted, 
    setIsMuted 
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    sound.playClickSound();

    try {
      const result = await loginAsAdmin(username, password);
      if (!result.success) {
        setErrorMessage(
          result.error || 
          (isBn 
            ? 'ভুল ইউজারনেম অথবা পাসওয়ার্ড! সঠিক তথ্য প্রদান করুন।' 
            : isHi 
            ? 'अमान्य यूजरनेम या पासवर्ड!' 
            : 'Invalid username or password! Please check credentials.')
        );
      }
    } catch (err) {
      setErrorMessage(isBn ? 'লগইন প্রক্রিয়া ব্যর্থ হয়েছে।' : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    sound.playClickSound();
    setUsername('admin');
    setPassword('echo123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language & Audio Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { sound.playClickSound(); setLanguage('bn'); }}
            className={`px-2.5 py-1 rounded-lg transition-all ${language === 'bn' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            বাংলা
          </button>
          <button
            onClick={() => { sound.playClickSound(); setLanguage('hi'); }}
            className={`px-2.5 py-1 rounded-lg transition-all ${language === 'hi' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            हिंदी
          </button>
          <button
            onClick={() => { sound.playClickSound(); setLanguage('en'); }}
            className={`px-2.5 py-1 rounded-lg transition-all ${language === 'en' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            EN
          </button>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-xl border text-xs transition-all backdrop-blur-md ${
            isMuted
              ? 'bg-slate-900/90 text-slate-500 border-slate-800'
              : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-5">
        
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 flex items-center justify-center shadow-2xl shadow-emerald-950/90 ring-4 ring-emerald-400/30">
              <span className="text-3xl sm:text-4xl font-black text-white">চা</span>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full ring-2 ring-slate-950">
              <KeyRound className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
              {t.adminLoginTitle || 'চালাও সমবায় সেন্ট্রাল অ্যাডমিন লগইন'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {t.adminLoginSubtitle || 'অথরাইজড কো-অপারেটিভ ফ্লিট ও ডিসপ্যাচ কন্ট্রোল প্যানেল'}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5 ring-1 ring-white/5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-300">
                {isBn ? 'সেন্ট্রাল কন্ট্রোল অ্যাক্সেস' : isHi ? 'केंद्रीय नियंत्रण पहुँच' : 'Root Control Access'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              256-BIT SSL
            </span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-2xl flex items-center gap-2.5 text-red-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="font-medium leading-tight">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.usernameLabel || 'অ্যাডমিন ইউজারনেম'}</span>
                </span>
                <span className="text-[10px] text-slate-500">অ্যাডমিন আইডি</span>
              </label>

              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-3 text-xs text-white font-mono font-bold focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.passwordLabel || 'সিকিউরিটি পাসওয়ার্ড'}</span>
                </span>
                <span className="text-[10px] text-slate-500">সিকিউর পাসওয়ার্ড</span>
              </label>

              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-3 pr-10 text-xs text-white font-mono font-bold focus:outline-none placeholder-slate-600 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.adminLoginBtn || 'লগইন করুন ও ড্যাশবোর্ড চালু করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Auto-Fill Pill */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleQuickFill}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isBn ? 'ডেমো তথ্য অটো-ফিল করুন (admin / echo123)' : isHi ? 'डेमो ऑटो-फिल करें (admin / echo123)' : 'Auto-fill Demo (admin / echo123)'}</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
          </div>

        </div>

        {/* Footer Cooperative Trust & Compliance Badge */}
        <div className="text-center space-y-1.5 text-slate-500 text-[11px]">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Multi-State Co-operative Societies Act 2002 • MoRTH</span>
          </div>
          <p className="text-[10px] text-slate-600">
            {t.adminSecurityNotice || 'সুরক্ষিত ২৫৬-বিট এনক্রিপ্টেড সেশন'}
          </p>
        </div>

      </div>

    </div>
  );
};
