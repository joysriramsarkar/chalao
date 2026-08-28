'use client';

import React from 'react';
import { FareBreakdown } from '../../services/coopEngine';
import { VehicleOption, Language } from '../../types';
import { X, ShieldCheck, Heart, Cpu, Landmark, Users, ArrowRight } from 'lucide-react';

interface FareBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  fare: FareBreakdown;
  vehicle: VehicleOption;
  language: Language;
  currencySymbol: string;
}

export const FareBreakdownModal: React.FC<FareBreakdownModalProps> = ({
  isOpen,
  onClose,
  fare,
  vehicle,
  language,
  currencySymbol
}) => {
  if (!isOpen) return null;

  const isBn = language === 'bn';
  const isHi = language === 'hi';

  const title = isBn 
    ? 'স্বচ্ছ সমবায় ফেয়ার ও কমিশন হিসাব' 
    : isHi 
    ? 'पारदर्शी सहकारी किराया एवं कमीशन गणना' 
    : 'Transparent Co-op Fare & Commission Breakdown';

  const subtitle = isBn 
    ? 'কোনো গোপন চার্জ নেই • চালক ও যাত্রীদের সরাসরি লাভ' 
    : isHi 
    ? 'कोई छिपा हुआ शुल्क नहीं • चालकों एवं यात्रियों को सीधा लाभ' 
    : 'No hidden fees • 100% Democratic Transparency & MoRTH Compliant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fare Itemization */}
        <div className="mt-4 space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>{isBn ? 'বেস ফেয়ার (Base Fare)' : isHi ? 'बेस किराया (Base Fare)' : 'Base Fare'}</span>
            <span className="font-semibold text-slate-100">{currencySymbol}{fare.baseFare}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>
              {isBn 
                ? `দূরত্ব চার্জ (${fare.distanceKm} কিমি @ ${currencySymbol}${vehicle.perKm}/কিমি)` 
                : isHi 
                ? `दूरी शुल्क (${fare.distanceKm} किमी @ ${currencySymbol}${vehicle.perKm}/किमी)` 
                : `Distance (${fare.distanceKm} km @ ${currencySymbol}${vehicle.perKm}/km)`}
            </span>
            <span className="font-semibold text-slate-100">{currencySymbol}{fare.distanceFare}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>
              {isBn 
                ? `সময় চার্জ (${fare.timeMinutes} মিনিট @ ${currencySymbol}${vehicle.perMin}/মিনিট)` 
                : isHi 
                ? `समय शुल्क (${fare.timeMinutes} मिनट @ ${currencySymbol}${vehicle.perMin}/मिनट)` 
                : `Duration (${fare.timeMinutes} min @ ${currencySymbol}${vehicle.perMin}/min)`}
            </span>
            <span className="font-semibold text-slate-100">{currencySymbol}{fare.timeFare}</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-slate-100">
            <span>{isBn ? 'মোট গ্রস ফেয়ার' : isHi ? 'कुल ग्रॉस किराया' : 'Total Gross Fare'}</span>
            <span>{currencySymbol}{fare.totalGrossFare}</span>
          </div>

          {fare.memberPatronageRebate > 0 && (
            <div className="flex justify-between items-center text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-800/50">
              <span className="font-medium">
                {isBn ? 'সদস্য প্যাট্রোনেজ রিবেট (৫% ছাড়)' : isHi ? 'सदस्य पैट्रोनेज छूट (५%)' : 'Member Patronage Rebate (5%)'}
              </span>
              <span className="font-bold">-{currencySymbol}{fare.memberPatronageRebate}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-base font-extrabold text-emerald-400">
            <span>{isBn ? 'যাত্রীর প্রদেয় মোট টাকা' : isHi ? 'अंतिम देय राशि' : 'Final Payable Amount'}</span>
            <span>{currencySymbol}{fare.finalRiderPayable}</span>
          </div>
        </div>

        {/* Co-op Platform Fee vs Corporate Comparison */}
        <div className="mt-4 p-3.5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 rounded-xl border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-emerald-300">
              {isBn 
                ? `চালাও সমবায় কমিশন (শুধুমাত্র ${fare.coopCommissionPercent}%)` 
                : isHi 
                ? `चलाओ सहकारी शुल्क (केवल ${fare.coopCommissionPercent}%)` 
                : `Chalao Co-op Fee (Only ${fare.coopCommissionPercent}%)`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              {isBn ? `চালকের পকেটে ${fare.driverTakeHomePercent}%` : isHi ? `चालक को मिलता है ${fare.driverTakeHomePercent}%` : `Driver keeps ${fare.driverTakeHomePercent}%`}
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full flex items-center justify-center text-[8px] font-bold text-slate-950" 
              style={{ width: `${fare.driverTakeHomePercent}%` }}
            >
              {fare.driverTakeHomePercent}%
            </div>
            <div 
              className="bg-teal-400 h-full flex items-center justify-center text-[8px] font-bold text-slate-950" 
              style={{ width: `${fare.coopCommissionPercent}%` }}
            >
              {fare.coopCommissionPercent}%
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] mt-2 text-slate-300">
            <span>
              {isBn ? 'চালক সরাসরি পান:' : isHi ? 'चालक शुद्ध कमाई:' : 'Driver Net:'} <strong className="text-emerald-400 text-sm">{currencySymbol}{fare.driverTakeHome}</strong>
            </span>
            <span>
              {isBn ? 'প্ল্যাটফর্ম ফি:' : isHi ? 'सहकारी शुल्क:' : 'Co-op Fee:'} <strong className="text-teal-300">{currencySymbol}{fare.platformFee}</strong>
            </span>
          </div>
        </div>

        {/* Where does the Co-op Fee go? */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            {isBn 
              ? `প্ল্যাটফর্ম ফির (${currencySymbol}${fare.platformFee}) স্বচ্ছ বণ্টন:` 
              : isHi 
              ? `सहकारी शुल्क (${currencySymbol}${fare.platformFee}) का पारदर्शी वितरण:` 
              : `Allocation of Co-op Fee (${currencySymbol}${fare.platformFee}):`}
          </h4>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">{isBn ? 'চালক কল্যাণ ও প্যাট্রোনেজ' : isHi ? 'चालक कल्याण फंड' : 'Driver Welfare'} (30%)</div>
                <div className="text-emerald-400 font-bold">{currencySymbol}{fare.feeAllocation.driverWelfareAndPatronage}</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Landmark className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">{isBn ? 'আইনসম্মত রিজার্ভ ফান্ড' : isHi ? 'सांविधिक रिजर्व फंड' : 'Legal Reserve'} (25%)</div>
                <div className="text-emerald-400 font-bold">{currencySymbol}{fare.feeAllocation.legalReserve}</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">{isBn ? 'যাত্রী রিবেট ফান্ড' : isHi ? 'यात्री छूट पूल' : 'Rider Rebate Pool'} (15%)</div>
                <div className="text-emerald-400 font-bold">{currencySymbol}{fare.feeAllocation.riderRebatePool}</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">{isBn ? 'টেক ও সার্ভার রক্ষণাবেক্ষণ' : isHi ? 'तकनीकी एवं सर्वर' : 'Tech & Server'} (15%)</div>
                <div className="text-emerald-400 font-bold">{currencySymbol}{fare.feeAllocation.techAndPlatform}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{isBn ? 'বুঝেছি (বন্ধ করুন)' : isHi ? 'समझ गए (बंद करें)' : 'Understood (Close)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
