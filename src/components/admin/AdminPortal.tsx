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
  Save
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
    resolveIncident, 
    updatePricingRule,
    getCurrencySymbol,
    currentCity
  } = useApp();

  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  const [activeTab, setActiveTab] = useState<'fleet' | 'kyc' | 'pricing' | 'incidents'>('fleet');
  const [editingPricing, setEditingPricing] = useState<PricingRule[]>(pricingRules);
  const [saveToast, setSaveToast] = useState(false);

  const pendingDrivers = drivers.filter(d => d.verificationStatus === 'pending');
  const onlineDrivers = drivers.filter(d => d.isOnline);
  const busyDrivers = drivers.filter(d => d.isBusy);
  const openIncidents = incidents.filter(i => i.status !== 'resolved');

  const handleSavePricing = () => {
    editingPricing.forEach(rule => updatePricingRule(rule));
    setSaveToast(true);
    sound.playTripStartedChime();
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Top Admin Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{t.activeDrivers}</div>
            <div className="text-lg font-black text-white">{onlineDrivers.length} / {drivers.length}</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{t.busyDrivers}</div>
            <div className="text-lg font-black text-amber-400">{busyDrivers.length}</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{isBn ? 'অপেক্ষমান KYC ও DL' : isHi ? 'लंबित केवाईसी' : 'Pending KYC & DL'}</div>
            <div className="text-lg font-black text-sky-300">{pendingDrivers.length}</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{isBn ? 'খোলা ইনসিডেন্ট' : isHi ? 'सक्रिय आपातकाल' : 'Open 112 Alerts'}</div>
            <div className="text-lg font-black text-red-400">{openIncidents.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'fleet'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.fleetOverview}</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'kyc'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>{t.pendingVerifications} ({pendingDrivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'pricing'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t.pricingConfigTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'incidents'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t.incidentControl} ({openIncidents.length})</span>
        </button>
      </div>

      {/* Tab 1: Live Fleet God-View Map & List */}
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
              <span>{isBn ? 'সক্রিয় ফ্লিট তালিকা' : isHi ? 'सक्रिय फ्लीट' : 'Active Fleet Drivers'}</span>
              <span className="text-emerald-400">{drivers.length} drivers</span>
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
                      <div className="font-bold text-slate-100">{driver.name}</div>
                      <div className="text-[10px] text-slate-400">{driver.vehicleModel} • {driver.plateNumber}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      driver.isBusy 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : driver.isOnline 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {driver.isBusy ? 'ON TRIP' : driver.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Driver KYC & Commercial DL Approvals */}
      {activeTab === 'kyc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">
              {isBn ? 'ড্রাইভার আধার, প্যান ও কমার্শিয়াল DL ভেরিফিকেশন' : isHi ? 'ड्राइवर आधार, पैन एवं कमर्शियल DL सत्यापन' : 'Driver Aadhaar, PAN & Commercial DL Verification Desk'}
            </h3>
            <span className="text-xs text-slate-400">{pendingDrivers.length} pending</span>
          </div>

          {pendingDrivers.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <span>{isBn ? 'কোনো অপেক্ষমান ভেরিফিকেশন রিকোয়েস্ট নেই!' : 'No pending driver verifications.'}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDrivers.map(driver => (
                <div 
                  key={driver.id} 
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={driver.photo} 
                      alt={driver.name} 
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{driver.name}</div>
                      <div className="text-slate-400 mt-0.5">{driver.vehicleModel} • {driver.phone}</div>
                      <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                        DL: {driver.licenseNumber} | Aadhaar: {driver.aadhaarNumber} | PAN: {driver.panNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => verifyDriverKyc(driver.id, 'verified')}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isBn ? 'অনুমোদন দিন' : 'Approve'}</span>
                    </button>
                    <button
                      onClick={() => verifyDriverKyc(driver.id, 'rejected')}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-semibold transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isBn ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    <span className="text-slate-400">{isBn ? `প্রতি কিমি রেট (${currencySymbol}):` : `Per Km Rate (${currencySymbol}):`}</span>
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
                    <span className="text-slate-400">{isBn ? 'প্ল্যাটফর্ম কমিশন (%):' : 'Platform Fee (%):'}</span>
                    <input 
                      type="number"
                      max={12}
                      min={0}
                      value={rule.platformCommissionPercent}
                      onChange={(e) => {
                        const updated = [...editingPricing];
                        updated[idx].platformCommissionPercent = Number(e.target.value);
                        setEditingPricing(updated);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-teal-300 font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Emergency Incident & SOS Control */}
      {activeTab === 'incidents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{isBn ? 'জরুরি সুরক্ষা ও ইনসিডেন্ট টিকিট কন্ট্রোল' : 'Emergency 112 & Dispute Dispatch Desk'}</span>
            </h3>
            <span className="text-xs text-red-400 font-bold">{openIncidents.length} active</span>
          </div>

          <div className="space-y-3">
            {incidents.map(inc => (
              <div 
                key={inc.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  inc.status === 'resolved'
                    ? 'bg-slate-950 border-slate-800 opacity-60'
                    : 'bg-red-950/20 border-red-500/40 shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      inc.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {inc.type} • {inc.severity}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{inc.rideId}</span>
                    <span className="text-slate-500 text-[10px]">• {inc.timestamp}</span>
                  </div>

                  <div className="font-bold text-white text-xs mt-1">
                    {inc.reporterName} ({inc.reporterRole})
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5">{inc.description}</p>
                </div>

                {inc.status !== 'resolved' ? (
                  <button
                    onClick={() => resolveIncident(inc.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow"
                  >
                    {t.resolveIncident}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
