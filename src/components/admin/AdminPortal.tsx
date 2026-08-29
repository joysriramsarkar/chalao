'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { MapComponent } from '../common/MapComponent';
import { PricingRule } from '../../types';
import { 
  Layers, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Sliders, 
  FileCheck, 
  Activity, 
  TrendingUp,
  Save,
  RefreshCw,
  Phone,
  Car,
  CreditCard,
  UserCheck,
  Clock,
  Check
} from 'lucide-react';
import { sound } from '../../services/audioService';

export const AdminPortal: React.FC = () => {
  const { 
    language, 
    drivers, 
    activeRide, 
    incidents, 
    pricingRules, 
    verifyDriverKyc, 
    updatePricingRule,
    getCurrencySymbol,
    currentCity,
    refreshDrivers,
    isRefreshing
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  const [activeTab, setActiveTab] = useState<'kyc' | 'fleet' | 'pricing' | 'incidents'>('kyc');
  const [editingPricing, setEditingPricing] = useState<PricingRule[]>(pricingRules);
  const [saveToast, setSaveToast] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const pendingDrivers = drivers.filter(d => d.verificationStatus === 'pending');
  const verifiedDrivers = drivers.filter(d => d.verificationStatus === 'verified');
  const onlineDrivers = drivers.filter(d => d.isOnline);
  const busyDrivers = drivers.filter(d => d.isBusy);
  const openIncidents = incidents.filter(i => i.status !== 'resolved');

  const handleSavePricing = () => {
    editingPricing.forEach(rule => updatePricingRule(rule));
    setSaveToast(true);
    sound.playTripStartedChime();
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleVerify = async (driverId: string, status: 'verified' | 'rejected') => {
    await verifyDriverKyc(driverId, status);
    setActionSuccessToast(status === 'verified' ? 'চালক সফলভাবে অনুমোদিত হয়েছে!' : 'চালকের আবেদন প্রত্যাখ্যাত হয়েছে।');
    setTimeout(() => setActionSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Top Admin Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Pending KYC & DL */}
        <div 
          onClick={() => setActiveTab('kyc')}
          className={`p-4 bg-slate-900 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
            activeTab === 'kyc' ? 'border-sky-500 ring-1 ring-sky-500/50' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">{isBn ? 'অপেক্ষমান KYC ও DL' : isHi ? 'लंबित केवाईसी' : 'Pending KYC & DL'}</div>
            <div className="text-xl font-black text-sky-300 flex items-center gap-2">
              <span>{pendingDrivers.length}</span>
              {pendingDrivers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 animate-pulse">নতুন</span>
              )}
            </div>
          </div>
        </div>

        {/* Total & Verified Drivers */}
        <div 
          onClick={() => setActiveTab('fleet')}
          className={`p-4 bg-slate-900 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
            activeTab === 'fleet' ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">{isBn ? 'মোট নিবন্ধিত চালক' : 'Total Drivers'}</div>
            <div className="text-xl font-black text-white">{drivers.length} <span className="text-xs text-slate-500 font-normal">({verifiedDrivers.length} অনুমোদিত)</span></div>
          </div>
        </div>

        {/* Online & Active Drivers */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">{isBn ? 'লাইভ অনলাইন চালক' : 'Online Drivers'}</div>
            <div className="text-xl font-black text-emerald-400">{onlineDrivers.length} / {drivers.length}</div>
          </div>
        </div>

        {/* Safety & SOS Alerts */}
        <div 
          onClick={() => setActiveTab('incidents')}
          className={`p-4 bg-slate-900 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
            activeTab === 'incidents' ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">{isBn ? 'জরুরি ১১২ এলার্ট' : '112 SOS Alerts'}</div>
            <div className="text-xl font-black text-red-400">{openIncidents.length}</div>
          </div>
        </div>
      </div>

      {actionSuccessToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'kyc'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{isBn ? 'চালক ও KYC অনুমোদন' : 'Driver KYC Verification'} ({pendingDrivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'fleet'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isBn ? 'লাইভ ফ্লিট ও মানচিত্র' : 'Live Fleet Map'} ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'pricing'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isBn ? 'কমিশন ও প্রাইসিং ইঞ্জিন' : 'Pricing & Co-op Rules'}</span>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'incidents'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isBn ? '১১২ সেফটি ইনসিডেন্ট' : '112 Emergency'} ({openIncidents.length})</span>
          </button>
        </div>

        <button
          onClick={() => refreshDrivers()}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'ডাটা সিঙ্ক হচ্ছে...' : 'রিফ্রেশ'}</span>
        </button>
      </div>

      {/* Tab 1: KYC & Driver Registrations from Neon DB */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-400" />
              <span>{isBn ? 'নিবন্ধিত চালকগণের আবেদন তালিকা (Neon PostgreSQL Live)' : 'Registered Drivers Applications (Neon DB Live)'}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {pendingDrivers.length} অপেক্ষমান • {verifiedDrivers.length} অনুমোদিত
            </span>
          </div>

          {drivers.length === 0 ? (
            <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
              <Car className="w-12 h-12 mx-auto text-slate-600 animate-bounce" />
              <div className="text-slate-300 font-bold">এখনও কোনো চালক নিবন্ধন করেননি</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ড্রাইভার অ্যাপ থেকে OTP ভেরিফাই করে KYC সাবমিট করলেই চালকের তথ্য তাৎক্ষণিকভাবে এখানে চলে আসবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drivers.map(driver => {
                const isPending = driver.verificationStatus === 'pending';
                const isVerified = driver.verificationStatus === 'verified';
                const isRejected = driver.verificationStatus === 'rejected';

                return (
                  <div 
                    key={driver.id} 
                    className={`p-5 bg-slate-900 border rounded-2xl transition-all shadow-xl ${
                      isPending ? 'border-sky-500/60 ring-1 ring-sky-500/20 bg-slate-900/90' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      
                      {/* Driver Avatar & Primary Info */}
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img 
                            src={driver.photo} 
                            alt={driver.name} 
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 shadow-md"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            driver.isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                          }`} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{driver.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                              isPending 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                : isVerified 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              {isPending ? 'অপেক্ষমান (In Review)' : isVerified ? 'অনুমোদিত (Approved)' : 'প্রত্যাখ্যাত (Rejected)'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {driver.vehicleType?.toUpperCase() || 'SEDAN'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{driver.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-200">{driver.vehicleModel || 'গাড়ি'}</span>
                              <span className="text-slate-500">({driver.plateNumber || 'RC Pending'})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                              <span className="text-teal-300">UPI: {driver.upiId || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KYC Document Verification Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">Driving License</span>
                          <span className="text-amber-300 font-bold">{driver.licenseNumber || 'DL-Pending'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">Vehicle RC</span>
                          <span className="text-sky-300 font-bold">{driver.rcNumber || 'RC-Pending'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
                          <span className="text-slate-500 block text-[9px] uppercase">Aadhaar / PAN</span>
                          <span className="text-slate-300">{driver.aadhaarNumber || 'Aadhaar'} / {driver.panNumber || 'PAN'}</span>
                        </div>
                      </div>

                      {/* Approve / Reject Actions */}
                      <div className="flex items-center gap-2 w-full lg:w-auto">
                        <button
                          onClick={() => handleVerify(driver.id, 'verified')}
                          className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                            isVerified 
                              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 cursor-default' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{isVerified ? 'অনুমোদিত আছে' : 'অনুমোদন দিন (Approve)'}</span>
                        </button>

                        <button
                          onClick={() => handleVerify(driver.id, 'rejected')}
                          className={`flex-1 lg:flex-none px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                            isRejected 
                              ? 'bg-rose-600/30 text-rose-400 border border-rose-500/40' 
                              : 'bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">প্রত্যাখ্যান</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Fleet God-View Map & List */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-[460px] sm:h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <MapComponent 
              pickup={activeRide?.pickup}
              dropoff={activeRide?.dropoff}
              routePolyline={activeRide?.routePolyline}
              currentPos={activeRide?.currentPos}
              drivers={drivers}
              showDrivers={true}
              centerCoords={currentCity.center}
            />
          </div>

          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 h-[460px] sm:h-[520px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>{isBn ? 'সক্রিয় ফ্লিট চালকবৃন্দ' : 'Active Fleet Drivers'}</span>
              <span className="text-emerald-400 font-mono">{drivers.length} চালক</span>
            </h3>

            <div className="space-y-2 text-xs">
              {drivers.map(driver => (
                <div 
                  key={driver.id} 
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={driver.photo} 
                      alt={driver.name} 
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{driver.name}</span>
                        {driver.isOnline && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{driver.vehicleModel} • {driver.phone}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      driver.verificationStatus === 'verified' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {driver.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Pricing & Commission Engine */}
      {activeTab === 'pricing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                {isBn ? 'স্বচ্ছ সমবায় প্রাইসিং ও প্ল্যাটফর্ম কমিশন কনফিগারেশন' : 'Pricing & Cooperative Commission Engine'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? `প্রতিটি বাহনের বেস ফেয়ার, কিমি রেট ও সমবায় ফি (সর্বোচ্চ ১০%) নির্ধারণ করুন` : 'Configure base fares and cooperative fee percentages'}
              </p>
            </div>

            <button
              onClick={handleSavePricing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Rules'}</span>
            </button>
          </div>

          {saveToast && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-pulse">
              ✓ {isBn ? 'প্রাইসিং রুলস সফলভাবে আপডেট হয়েছে!' : 'Pricing rules updated successfully!'}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {editingPricing.map((rule, idx) => (
              <div key={rule.vehicleType} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="font-bold text-emerald-400 uppercase tracking-wider flex justify-between">
                  <span>{rule.vehicleType}</span>
                  <span className="text-teal-300 font-black">{rule.platformCommissionPercent}% Fee</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isBn ? `বেস ফেয়ার (${currencySymbol}):` : `Base Fare (${currencySymbol}):`}</span>
                    <input 
                      type="number"
                      value={rule.baseFare}
                      onChange={(e) => {
                        const updated = [...editingPricing];
                        updated[idx].baseFare = Number(e.target.value);
                        setEditingPricing(updated);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-bold"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isBn ? `প্রতি কিমি রেট (${currencySymbol}):` : `Per KM Rate (${currencySymbol}):`}</span>
                    <input 
                      type="number"
                      value={rule.perKm}
                      onChange={(e) => {
                        const updated = [...editingPricing];
                        updated[idx].perKm = Number(e.target.value);
                        setEditingPricing(updated);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-bold"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isBn ? 'প্ল্যাটফর্ম ফি (%):' : 'Platform Fee (%):'}</span>
                    <input 
                      type="number"
                      max={12}
                      min={5}
                      value={rule.platformCommissionPercent}
                      onChange={(e) => {
                        const updated = [...editingPricing];
                        updated[idx].platformCommissionPercent = Number(e.target.value);
                        setEditingPricing(updated);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Emergency 112 SOS Incident Control */}
      {activeTab === 'incidents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{isBn ? 'জাতীয় জরুরি পরিষেবা ১১২ ও এসওএস কন্ট্রোল হাব' : '112 Emergency Incident Control'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? 'যাত্রী ও চালকের লাইভ নিরাপত্তা এলার্ট ও পুলিশ সংযোগ কেন্দ্র' : 'Active SOS alerts with emergency dispatcher'}
              </p>
            </div>
            <span className="text-xs font-bold text-red-400 bg-red-950/40 border border-red-800/60 px-3 py-1 rounded-xl">
              {openIncidents.length} Active Alerts
            </span>
          </div>

          {openIncidents.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <span>{isBn ? 'বর্তমানে কোনো জরুরি এলার্ট নেই। সব যাত্রা নিরাপদ!' : 'No open emergency incidents.'}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {openIncidents.map(inc => (
                <div 
                  key={inc.id} 
                  className="p-4 bg-red-950/20 border border-red-500/40 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-red-300 flex items-center gap-2">
                      <span>{inc.id}</span>
                      <span className="px-2 py-0.5 rounded bg-red-500 text-white font-black text-[10px] uppercase">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-slate-300 mt-1">{inc.description}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      রিপোর্টার: {inc.reporterName} ({inc.reporterRole}) • {inc.timestamp}
                    </div>
                  </div>

                  <a 
                    href="tel:112"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50"
                  >
                    <Phone className="w-4 h-4" />
                    <span>কল ১১২</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
