'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { projectDriverPatronage, COOP_FINANCIAL_SUMMARY_2026 } from '../../services/coopEngine';
import confetti from 'canvas-confetti';
import { 
  Award, 
  Vote, 
  Calculator, 
  Landmark, 
  CheckCircle2, 
  Plus, 
  Download, 
  Sparkles,
  PieChart
} from 'lucide-react';
import { sound } from '../../services/audioService';

export const MemberPortal: React.FC = () => {
  const { language, rider, motions, castVote, buyShares, getCurrencySymbol, currentCity } = useApp();
  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';
  const currencySymbol = getCurrencySymbol();

  const [activeTab, setActiveTab] = useState<'certificate' | 'voting' | 'patronage' | 'financials'>('certificate');
  
  // Patronage Calculator state
  const [calcDailyTrips, setCalcDailyTrips] = useState(10);
  const [calcAvgFare, setCalcAvgFare] = useState(150);
  const [calcShares, setCalcShares] = useState(rider.sharesOwned || 10);

  // Buy shares modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [shareCountToBuy, setShareCountToBuy] = useState(5);

  const patronageResult = projectDriverPatronage(calcDailyTrips, calcAvgFare, calcShares);

  const triggerConfetti = () => {
    sound.playTripCompletedFanfare();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899']
    });
  };

  const handleBuySharesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buyShares(shareCountToBuy);
    setShowBuyModal(false);
    triggerConfetti();
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 sm:p-6 rounded-3xl border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
              {isBn ? 'গণতান্ত্রিক সমবায় গভর্নেন্স (MSCS Act)' : isHi ? 'लोकतांत्रिक सहकारी गवर्नेंस' : 'Democratic Cooperative Governance'}
            </span>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t.votingMotto}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isBn ? 'চালাও সমবায় সদস্য ও মালিকানা পোর্টাল' : isHi ? 'चलाओ सहकारी सदस्य एवं स्वामित्व पोर्टल' : 'Chalao Co-op Member & Ownership Portal'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isBn 
              ? 'এখানে প্রতিটি চালক ও যাত্রী শুধু গ্রাহক নন, সমবায়ের সমান ভোটাধিকারপ্রাপ্ত সম্মানিত মালিক-অংশীদার।' 
              : isHi 
              ? 'यहाँ प्रत्येक चालक एवं सवारी केवल उपयोगकर्ता नहीं, बल्कि समान मताधिकार प्राप्त सम्मानित मालिक हैं।' 
              : 'Where drivers and riders are not mere users, but equal voting member-owners sharing platform surplus.'}
          </p>
        </div>

        <button
          onClick={() => setShowBuyModal(true)}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition-all transform active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? `নতুন শেয়ার কিনুন (${currencySymbol}৫০০/টি)` : isHi ? `नए शेयर खरीदें (${currencySymbol}५००/शेयर)` : `Buy Co-op Shares (${currencySymbol}500/ea)`}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'certificate'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t.shareCertificateTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('voting')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'voting'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>{t.votingHubTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('patronage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'patronage'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{t.patronageCalculatorTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'financials'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>{t.financialTransparency}</span>
        </button>
      </div>

      {/* Tab 1: Digital Share Certificate */}
      {activeTab === 'certificate' && (
        <div className="space-y-6">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/70 p-6 sm:p-10 rounded-3xl border-4 border-emerald-500/50 shadow-2xl overflow-hidden text-center space-y-6">
            
            {/* Ornamental Corners */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Multi-State Co-operative Societies Act, 2002 • Registered</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {isBn ? 'চালাও সমবায় শেয়ার ও মালিকানা সনদ' : isHi ? 'चलाओ सहकारी शेयर एवं स्वामित्व प्रमाण पत्र' : 'CHALAO COOPERATIVE SHARE CERTIFICATE'}
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {isBn 
                  ? 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে নিম্নোক্ত সদস্য চালাও ডিজিটাল কো-অপারেটিভ সোসাইটির একজন সম্মানিত শেয়ারহোল্ডার ও সমান ভোটাধিকারপ্রাপ্ত মালিক।' 
                  : isHi 
                  ? 'यह प्रमाणित किया जाता है कि निम्नलिखित सदस्य चलाओ डिजिटल सहकारी समिति के वैध शेयरधारक एवं समान मताधिकार प्राप्त स्वामी हैं।' 
                  : 'This certifies that the member below is a bona-fide voting owner and shareholder in Chalao Multi-State Cooperative Society Ltd.'}
              </p>
            </div>

            {/* Member Details in Certificate */}
            <div className="max-w-xl mx-auto bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/30 grid grid-cols-2 gap-4 text-left text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">{isBn ? 'সদস্যের নাম:' : isHi ? 'सदस्य का नाम:' : 'Member Name:'}</span>
                <strong className="text-white text-sm">{rider.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isBn ? 'সদস্য নম্বর:' : isHi ? 'सदस्य संख्या:' : 'Member ID:'}</span>
                <strong className="text-emerald-400 font-mono text-sm">{rider.memberId || 'CH-IN-M109'}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isBn ? 'শেয়ারের সংখ্যা:' : isHi ? 'शेयर संख्या:' : 'Shares Owned:'}</span>
                <strong className="text-amber-400 text-sm">{rider.sharesOwned} {isBn ? 'টি শেয়ার' : 'Shares'}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isBn ? 'পরিশোধিত শেয়ার মূলধন:' : isHi ? 'चुक्ता पूंजी:' : 'Capital Value:'}</span>
                <strong className="text-emerald-400 text-sm">{currencySymbol}{rider.sharesOwned * 500}</strong>
              </div>
            </div>

            {/* Seal & Signatures */}
            <div className="flex flex-col sm:flex-row items-center justify-between max-w-xl mx-auto pt-4 border-t border-slate-800 gap-4 text-xs">
              <div className="text-center sm:text-left">
                <div className="font-semibold text-slate-300">Board Chairperson</div>
                <div className="text-[10px] text-slate-500">Chalao Co-op Society Ltd.</div>
              </div>

              {/* Digital Seal */}
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-400/80 bg-emerald-950/60 flex flex-col items-center justify-center text-[8px] font-black text-emerald-300 uppercase tracking-tighter ring-4 ring-emerald-500/20">
                <span>OFFICIAL</span>
                <span>SEAL</span>
                <span>INDIA</span>
              </div>

              <div className="text-center sm:text-right">
                <div className="font-semibold text-slate-300">General Secretary</div>
                <div className="text-[10px] text-slate-500">Digital Audit Verified</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={triggerConfetti}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? 'সনদ ডাউনলোড ও উদযাপন' : isHi ? 'प्रमाण पत्र डाउनलोड करें' : 'Download Certificate'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Democratic E-Voting Center */}
      {activeTab === 'voting' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Vote className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'চলমান সমবায় প্রস্তাবসমূহ ও ই-ভোট' : isHi ? 'सक्रिय सहकारी प्रस्ताव एवं ई-वोटिंग' : 'Active Motions & Ballot'}</span>
            </h3>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {t.votingMotto}
            </span>
          </div>

          <div className="space-y-4">
            {motions.map(motion => {
              const totalVotes = motion.yesVotes + motion.noVotes + motion.abstainVotes;
              const yesPercent = totalVotes > 0 ? Math.round((motion.yesVotes / totalVotes) * 100) : 0;
              const noPercent = totalVotes > 0 ? Math.round((motion.noVotes / totalVotes) * 100) : 0;

              return (
                <div 
                  key={motion.id} 
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase">
                        {motion.category}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white mt-1.5">
                        {isBn ? motion.titleBn : isHi ? motion.titleHi : motion.titleEn}
                      </h4>
                    </div>

                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {isBn ? `সময়সীমা: ${motion.deadline}` : `Deadline: ${motion.deadline}`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isBn ? motion.descriptionBn : isHi ? motion.descriptionHi : motion.descriptionEn}
                  </p>

                  {/* Vote Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-400">{t.yes}: {motion.yesVotes} ({yesPercent}%)</span>
                      <span className="text-rose-400">{t.no}: {motion.noVotes} ({noPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 flex overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${yesPercent}%` }} />
                      <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${noPercent}%` }} />
                    </div>
                  </div>

                  {/* Voting Ballot Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    {motion.myVote ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isBn ? `আপনার ভোট দেওয়া হয়েছে: [${motion.myVote.toUpperCase()}]` : isHi ? `आपका वोट दर्ज हुआ: [${motion.myVote.toUpperCase()}]` : `Your ballot cast: [${motion.myVote.toUpperCase()}]`}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => castVote(motion.id, 'yes')}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-200 hover:text-white font-bold text-xs transition-all"
                        >
                          👍 {t.yes}
                        </button>
                        <button
                          onClick={() => castVote(motion.id, 'no')}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-xs transition-all"
                        >
                          👎 {t.no}
                        </button>
                        <button
                          onClick={() => castVote(motion.id, 'abstain')}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs transition-all"
                        >
                          {t.abstain}
                        </button>
                      </div>
                    )}

                    <span className="text-[11px] text-slate-500 font-medium">
                      {totalVotes} / {motion.totalEligible} {isBn ? 'সদস্য ভোট দিয়েছেন' : 'members voted'}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Patronage Distribution Calculator */}
      {activeTab === 'patronage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isBn ? 'চালক প্যাট্রোনেজ ও লভ্যাংশ সিমুলেটর' : isHi ? 'चालक पैट्रोनेज एवं लाभांश कैलकुलेटर' : 'Driver Patronage & Dividend Simulator'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn ? 'আপনার রাইড সংখ্যা অনুযায়ী বছর শেষে কত টাকা লভ্যাংশ পাবেন?' : 'Calculate annual co-op surplus distribution based on your activity'}
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isBn ? 'দৈনিক গড় রাইড সংখ্যা:' : isHi ? 'दैनिक औसत ट्रिप:' : 'Daily Completed Rides:'}</span>
                  <strong className="text-emerald-400 font-bold">{calcDailyTrips} {isBn ? 'টি' : ''}</strong>
                </div>
                <input 
                  type="range" 
                  min={2} 
                  max={25} 
                  value={calcDailyTrips}
                  onChange={(e) => setCalcDailyTrips(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isBn ? `গড় রাইড ফেয়ার (${currencySymbol}):` : `Average Fare (${currencySymbol}):`}</span>
                  <strong className="text-emerald-400 font-bold">{currencySymbol}{calcAvgFare}</strong>
                </div>
                <input 
                  type="range" 
                  min={40} 
                  max={500} 
                  step={10}
                  value={calcAvgFare}
                  onChange={(e) => setCalcAvgFare(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isBn ? 'মালিকানাধীন শেয়ার সংখ্যা:' : 'Co-op Shares Owned:'}</span>
                  <strong className="text-amber-400 font-bold">{calcShares} ({currencySymbol}{calcShares * 500})</strong>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={50} 
                  value={calcShares}
                  onChange={(e) => setCalcShares(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300">
              💡 {isBn 
                ? 'কর্পোরেট অ্যাপের ২৫-৩০% কমিশনের বিপরীতে চালাও সমবায়ের উদ্বৃত্ত ফান্ড সদস্যদের মাঝে প্যাট্রোনেজ হিসেবে ফেরত দেওয়া হয়।' 
                : 'Unlike 25-30% corporate cuts, Chalao co-op redistributes surplus back to driver & rider members.'}
            </div>
          </div>

          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-400 mb-1 uppercase tracking-wider">
                {isBn ? 'সমবায় আর্থিক সুবিধা প্রক্ষেপণ' : 'PROJECTED ANNUAL BENEFIT'}
              </div>
              <h4 className="text-xl font-black text-white">
                {isBn ? 'আপনার সম্ভাব্য বার্ষিক বাড়তি লাভ' : 'Your Projected Annual Net Co-op Advantage'}
              </h4>
            </div>

            <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>{isBn ? 'বার্ষিক সম্ভাব্য প্যাট্রোনেজ বোনাস:' : 'Annual Patronage Bonus:'}</span>
                <strong className="text-emerald-300 text-sm">{currencySymbol}{patronageResult.projectedAnnualPatronageBonus}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{isBn ? 'শেয়ারের ওপর সম্ভাব্য ডিভিডেন্ড:' : 'Dividend on Share Capital:'}</span>
                <strong className="text-amber-400 text-sm">{currencySymbol}{patronageResult.projectedDividendOnShares}</strong>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-emerald-400 font-extrabold text-base">
                <span>{isBn ? 'মোট বার্ষিক সমবায় আয়:' : 'Total Annual Surplus Retained:'}</span>
                <span>{currencySymbol}{patronageResult.totalAnnualCoopBenefit}</span>
              </div>
            </div>

            {/* Corporate Comparison */}
            <div className="p-3.5 bg-rose-950/30 rounded-xl border border-rose-500/30 text-xs">
              <div className="font-bold text-rose-300 mb-1">
                {isBn ? '⚠️ সাধারণ কর্পোরেট অ্যাপে আপনি হারাতেন:' : '⚠️ Loss on 25% Corporate App:'}
              </div>
              <div className="text-lg font-black text-rose-400">
                {currencySymbol}{patronageResult.corporateComparisonLoss} {isBn ? 'টাকা প্রতি বছর' : 'per year'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isBn ? 'যা চালাও সমবায়ে সরাসরি আপনার পকেটে এবং আপনার মালিকানাধীন তহবিলে জমা হচ্ছে।' : 'Which is saved directly in your pocket & collective co-op wealth.'}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Tab 4: Financial Transparency Ledger */}
      {activeTab === 'financials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400">{isBn ? 'মোট রাইড ভলিউম (২০২৬)' : 'Gross Ride Volume'}</div>
              <div className="text-xl font-black text-white mt-1">{currencySymbol}{(COOP_FINANCIAL_SUMMARY_2026.totalGrossRideVolumeINR / 10000000).toFixed(2)} Cr</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">{COOP_FINANCIAL_SUMMARY_2026.totalCompletedRides.toLocaleString()} {isBn ? 'টি সম্পন্ন রাইড' : 'rides'}</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400">{isBn ? 'সক্রিয় সমবায় অংশীদার' : 'Active Co-op Members'}</div>
              <div className="text-xl font-black text-emerald-400 mt-1">{COOP_FINANCIAL_SUMMARY_2026.activeCoopMembers.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{COOP_FINANCIAL_SUMMARY_2026.activeDriverOwners} {isBn ? 'চালক' : 'drivers'} • {COOP_FINANCIAL_SUMMARY_2026.activeRiderMembers} {isBn ? 'যাত্রী' : 'riders'}</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400">{isBn ? 'সংগৃহীত প্ল্যাটফর্ম ফি (৮-১০%)' : 'Co-op Platform Fees'}</div>
              <div className="text-xl font-black text-amber-400 mt-1">{currencySymbol}{(COOP_FINANCIAL_SUMMARY_2026.totalPlatformFeesCollectedINR / 100000).toFixed(1)} Lakh</div>
              <div className="text-[11px] text-teal-400 mt-0.5">{isBn ? '১০০% স্বচ্ছ বণ্টন' : '100% Transparently Allocated'}</div>
            </div>
          </div>

          {/* Allocation Breakdown Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'সমবায় উদ্বৃত্ত তহবিলের স্বচ্ছ বিভাজন' : 'Cooperative Surplus Fund Allocation'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-rose-400">{isBn ? 'চালক প্যাট্রোনেজ বোনাস পুল' : 'Driver Patronage Pool'} (30%)</div>
                <div className="text-lg font-black text-white mt-1">{currencySymbol}{COOP_FINANCIAL_SUMMARY_2026.allocatedSurplus.driverPatronagePoolINR.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">{isBn ? 'চালকদের সক্রিয়তা ও রাইড অনুযায়ী বণ্টন' : 'Redistributed to active drivers'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-amber-400">{isBn ? 'আইনসম্মত রিজার্ভ ফান্ড' : 'Statutory Legal Reserve'} (25%)</div>
                <div className="text-lg font-black text-white mt-1">{currencySymbol}{COOP_FINANCIAL_SUMMARY_2026.allocatedSurplus.legalReserveINR.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">{isBn ? 'সমবায় আইনের বাধ্যতামূলক জরুরি তহবিল' : 'Mandatory safety buffer'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-sky-400">{isBn ? 'যাত্রী রিবেট ফান্ড' : 'Rider Patronage Rebate'} (15%)</div>
                <div className="text-lg font-black text-white mt-1">{currencySymbol}{COOP_FINANCIAL_SUMMARY_2026.allocatedSurplus.riderRebatePoolINR.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">{isBn ? 'সদস্য যাত্রীদের রাইড ছাড়ে ব্যবহৃত' : 'Discounts on passenger trips'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-indigo-400">{isBn ? 'প্রযুক্তি ও সার্ভার উন্নয়ন' : 'Tech & Server R&D'} (15%)</div>
                <div className="text-lg font-black text-white mt-1">{currencySymbol}{COOP_FINANCIAL_SUMMARY_2026.allocatedSurplus.techAndPlatformINR.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">{isBn ? 'অ্যাপ আপগ্রেড ও সাইবার নিরাপত্তা' : 'App upgrades & server costs'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-emerald-400">{isBn ? 'চালক স্বাস্থ্য ও দুর্ঘটনা বীমা' : 'Welfare & Emergency Fund'} (10%)</div>
                <div className="text-lg font-black text-white mt-1">{currencySymbol}{COOP_FINANCIAL_SUMMARY_2026.allocatedSurplus.welfareAndInsuranceINR.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">{isBn ? 'দুর্ঘটনায় তাৎক্ষণিক আর্থিক সাহায্য' : 'Emergency insurance cover'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-teal-400">{isBn ? 'শেয়ার মূলধনের লভ্যাংশ' : 'Shareholder Dividend'} (5%)</div>
                <div className="text-lg font-black text-white mt-1">{currencySymbol}{COOP_FINANCIAL_SUMMARY_2026.allocatedSurplus.shareholderDividendINR.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">{isBn ? 'সদস্যদের শেয়ার অনুপাতের ডিভিডেন্ড' : 'Annual dividend on capital'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Shares Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">{isBn ? 'চালাও সমবায় শেয়ার কিনুন' : 'Purchase Co-op Shares'}</h3>
              </div>
              <button 
                onClick={() => setShowBuyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBuySharesSubmit} className="space-y-4 text-xs">
              <p className="text-slate-300">
                {isBn 
                  ? `প্রতি শেয়ারের মূল্য ${currencySymbol}৫০০ টাকা। শেয়ার কেনার সাথে সাথে আপনার নামে ডিজিটাল সনদ ইস্যু হবে এবং আপনি সাধারণ সভায় ভোট দিতে পারবেন।` 
                  : `Each share is ${currencySymbol}500. Purchasing shares confers instant voting rights in the cooperative general assembly.`}
              </p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {isBn ? 'শেয়ারের সংখ্যা:' : 'Number of Shares:'}
                </label>
                <div className="flex items-center gap-3">
                  {[1, 5, 10, 20].map(cnt => (
                    <button
                      type="button"
                      key={cnt}
                      onClick={() => setShareCountToBuy(cnt)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                        shareCountToBuy === cnt 
                          ? 'bg-emerald-600 border-emerald-400 text-white' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cnt} {isBn ? 'টি' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-300">{isBn ? 'মোট পরিশোধযোগ্য:' : 'Total Payable:'}</span>
                <span className="text-emerald-400 text-base">{currencySymbol}{shareCountToBuy * 500}</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition-all"
              >
                {isBn ? 'পেমেন্ট সম্পন্ন ও মালিকানা গ্রহণ' : 'Confirm Purchase & Issue Certificate'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
