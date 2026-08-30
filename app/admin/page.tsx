'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AdminPortal } from '@/components/admin/AdminPortal';
import { AdminAuthScreen } from '@/components/admin/AdminAuthScreen';
import { Navbar } from '@/components/common/Navbar';
import { SafetyModal } from '@/components/safety/SafetyModal';

const AdminAppWrapper: React.FC = () => {
  const { setRole, refreshDrivers, isRefreshing, isAdminAuthenticated, logoutAdmin } = useApp();
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  React.useEffect(() => {
    setRole('admin');
  }, []);

  if (!isAdminAuthenticated) {
    return <AdminAuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500">
      <Navbar 
        onOpenSafety={() => setIsSafetyOpen(true)} 
        onRefresh={() => refreshDrivers()} 
        isRefreshing={isRefreshing}
        onLogout={logoutAdmin}
        isAdmin={true}
      />
      <main className="flex-1 py-3 sm:py-5">
        <AdminPortal />
      </main>
      <SafetyModal isOpen={isSafetyOpen} onClose={() => setIsSafetyOpen(false)} />
    </div>
  );
};

export default function AdminPage() {
  return (
    <AppProvider>
      <AdminAppWrapper />
    </AppProvider>
  );
}
