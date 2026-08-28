'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { 
  ShieldAlert, 
  PhoneCall, 
  Share2, 
  Phone, 
  X, 
  Copy, 
  Check, 
  Volume2,
  HeartHandshake
} from 'lucide-react';
import { sound } from '../../services/audioService';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose }) => {
  const { language, activeRide, rider, triggerSOS, currentCity } = useApp();
  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';
  const isHi = language === 'hi';

  const [sosTriggered, setSosTriggered] = useState(false);
  const [fakeCalling, setFakeCalling] = useState(false);
  const [fakeCallAnswered, setFakeCallAnswered] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleTriggerSOS = () => {
    setSosTriggered(true);
    triggerSOS(
      isBn 
        ? `জরুরি SOS সক্রিয় করা হয়েছে! লোকেশন: ${currentCity.nameBn}` 
        : isHi 
        ? `आपातकालीन SOS सक्रिय! स्थान: ${currentCity.nameHi}` 
        : `Emergency 112 SOS triggered in ${currentCity.nameEn}`
    );
  };

  const handleCopyShareLink = () => {
    const rideId = activeRide?.id || 'CH-IN-TRACK';
    const dummyUrl = `https://chalao.coop/track/${rideId}`;
    navigator.clipboard.writeText(dummyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const startFakeCall = () => {
    sound.playClickSound();
    setFakeCalling(true);
    setFakeCallAnswered(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.safetyHub}</h3>
              <p className="text-xs text-slate-400">{t.sosDesc}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOS Emergency Button */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-red-950/60 via-red-900/30 to-slate-900 border-2 border-red-500/60 text-center shadow-lg shadow-red-950/50">
          <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">
            {isBn ? 'জরুরি বিপদ সংকেত (১-ক্লিক SOS)' : isHi ? 'आपातकालीन १-क्लिक SOS' : 'EMERGENCY 1-CLICK SOS'}
          </div>
          
          <button
            onClick={handleTriggerSOS}
            className={`w-24 h-24 mx-auto rounded-full font-black text-xl flex flex-col items-center justify-center shadow-2xl transition-all ${
              sosTriggered 
                ? 'bg-red-600 text-white animate-ping-slow ring-8 ring-red-500/50 scale-105' 
                : 'bg-gradient-to-br from-red-500 to-red-700 text-white hover:scale-105 active:scale-95 ring-4 ring-red-500/30'
            }`}
          >
            <ShieldAlert className="w-7 h-7 mb-0.5" />
            <span>112 SOS</span>
          </button>

          {sosTriggered ? (
            <div className="mt-3 p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-xs text-red-200 font-bold animate-pulse">
              {isBn 
                ? '🚨 সেন্ট্রাল ডিসপ্যাচ ও জরুরি রেসপন্স টিমে অ্যালার্ট পাঠানো হয়েছে!' 
                : isHi 
                ? '🚨 केंद्रीय आपातकालीन नियंत्रण कक्ष को लाइव अलर्ट भेजा गया!' 
                : '🚨 Central Emergency 112 Control Alerted with GPS coordinates!'}
            </div>
          ) : (
            <p className="text-[11px] text-red-300/80 mt-2">
              {isBn 
                ? 'চাপলে সাথে সাথে সাইরেন বাজবে এবং সেন্ট্রাল কন্ট্রোল রুমে লোকেশন যাবে' 
                : isHi 
                ? 'दबाने पर तुरंत सायरन बजेगा और नियंत्रण कक्ष को लाइव स्थान भेजा जाएगा' 
                : 'Plays loud siren alarm & dispatches real-time GPS location to 112 dispatch.'}
            </p>
          )}
        </div>

        {/* Safety Tools Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* Live Trip Share */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <Share2 className="w-4 h-4" />
                <span>{isBn ? 'লাইভ রাইড শেয়ার' : isHi ? 'लाइव ट्रिप शेयर' : 'Share Live Trip'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'পরিবারকে লাইভ জিপিএস লোকেশন লিংক পাঠিয়ে দিন।' : isHi ? 'परिवार के साथ लाइव लोकेशन साझा करें।' : 'Send live GPS tracking link to family.'}
              </p>
            </div>
            <button
              onClick={handleCopyShareLink}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'ট্র্যাকিং লিংক কপি' : 'Copy Track Link')}</span>
            </button>
          </div>

          {/* Fake Emergency Call */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <PhoneCall className="w-4 h-4" />
                <span>{isBn ? 'ফেক ইমার্জেন্সি কল' : isHi ? 'फेक इमरजेंसी कॉल' : 'Fake Emergency Call'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'পরিস্থিতি এড়াতে তাৎক্ষণিক নকল ইনকামিং কল বাজান।' : isHi ? 'असहज स्थिति से बचने हेतु फोन की घंटी बजाएं।' : 'Simulate incoming call to exit safely.'}
              </p>
            </div>
            <button
              onClick={startFakeCall}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'কল রিং বাজান' : isHi ? 'घंटी बजाएं' : 'Trigger Fake Ring'}</span>
            </button>
          </div>

          {/* National 112 India Quick Dial */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 font-black text-xs">
                {currentCity.emergencyNumber}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{t.emergency112}</div>
                <div className="text-[10px] text-slate-400">
                  {isBn ? 'পুলিশ, ফায়ার ও অ্যাম্বুলেন্স' : isHi ? 'पुलिस एवं एम्बुलेंस' : 'Police, Fire, Ambulance'}
                </div>
              </div>
            </div>
            <a
              href={`tel:${currentCity.emergencyNumber}`}
              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-bold shadow transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Trusted Contact Speed Dial */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{rider.emergencyContact.name}</div>
                <div className="text-[10px] text-slate-400">{rider.emergencyContact.relation} • {rider.emergencyContact.phone}</div>
              </div>
            </div>
            <a
              href={`tel:${rider.emergencyContact.phone}`}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold shadow transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Fake Call Simulator Overlay */}
        {fakeCalling && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border-2 border-emerald-500/80 text-center animate-bounce-subtle">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-ping">
              <Phone className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">
              {fakeCallAnswered 
                ? (isBn ? '📞 কল চলছে... (কথা বলার অভিনয় করুন)' : isHi ? '📞 कॉल जारी है... (बात करने का अभिनय करें)' : '📞 Call In Progress...') 
                : (isBn ? 'ইনকামিং কল: আম্মা / Family' : isHi ? 'इनकमिंग कॉल: माँ / Family' : 'Incoming Call: Mom / Family')}
            </div>
            <div className="text-xs text-slate-400 mb-3">
              {fakeCallAnswered ? '00:18' : '+91 98300-00000'}
            </div>

            <div className="flex justify-center gap-3">
              {!fakeCallAnswered ? (
                <button
                  onClick={() => setFakeCallAnswered(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isBn ? 'রিসিভ করুন' : isHi ? 'उठाएं' : 'Answer'}</span>
                </button>
              ) : null}
              <button
                onClick={() => setFakeCalling(false)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isBn ? 'কল শেষ' : isHi ? 'काटें' : 'Hang Up'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
