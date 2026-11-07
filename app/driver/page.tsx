'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DriverApp } from '@/components/driver/DriverApp';
import { Navbar } from '@/components/common/Navbar';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { SafetyModal } from '@/components/safety/SafetyModal';

const DriverAppWrapper: React.FC = () => {
  const { isAuthenticated, authRole, setRole } = useApp();
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  React.useEffect(() => {
    setRole('driver');
  }, []);

  if (!isAuthenticated || authRole !== 'driver') {
    return <AuthScreen defaultRole="driver" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500">
      <Navbar onOpenSafety={() => setIsSafetyOpen(true)} />
      <main className="flex-1 py-3 sm:py-5">
        <DriverApp onOpenSafety={() => setIsSafetyOpen(true)} />
      </main>
      <SafetyModal isOpen={isSafetyOpen} onClose={() => setIsSafetyOpen(false)} />
    </div>
  );
};

export default function DriverPage() {
  // AppProvider already wraps the whole app in app/layout.tsx.
  return <DriverAppWrapper />;
}
