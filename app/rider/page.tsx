'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { RiderApp } from '@/components/rider/RiderApp';
import { Navbar } from '@/components/common/Navbar';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { SafetyModal } from '@/components/safety/SafetyModal';

const RiderAppWrapper: React.FC = () => {
  const { isAuthenticated, setRole } = useApp();
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  React.useEffect(() => {
    setRole('rider');
  }, []);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500">
      <Navbar onOpenSafety={() => setIsSafetyOpen(true)} />
      <main className="flex-1 py-3 sm:py-5">
        <RiderApp onOpenSafety={() => setIsSafetyOpen(true)} />
      </main>
      <SafetyModal isOpen={isSafetyOpen} onClose={() => setIsSafetyOpen(false)} />
    </div>
  );
};

export default function RiderPage() {
  return (
    <AppProvider>
      <RiderAppWrapper />
    </AppProvider>
  );
}
