import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Sidebar, AdminTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CallLogsPage } from './pages/CallLogsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { LoginPage } from './pages/LoginPage';
import { CallDetailModal } from './components/CallDetailModal';
import { CallRecord } from '@call-agent/shared';

const AdminLayout: React.FC = () => {
  const { admin, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <LoginPage />;
  }

  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Executive Telephony Dashboard', subtitle: 'Real-time cellular call metrics across all enterprise HR units' };
      case 'calls':
        return { title: 'Cellular Call Logs & Audit', subtitle: 'Complete log of inbound and outbound cellular calls with duration and outcomes' };
      case 'employees':
        return { title: 'HR Employee Directory & Assignment', subtitle: 'Manage corporate identities, phone assignments, and account permissions' };
      case 'audit':
        return { title: 'Security Audit & Compliance Trail', subtitle: 'Administrative activity logs and security compliance events' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage onSelectCallRecord={setSelectedCall} />
          )}

          {currentTab === 'calls' && (
            <CallLogsPage onSelectCallRecord={setSelectedCall} />
          )}

          {currentTab === 'employees' && (
            <EmployeesPage
              onViewEmployeeCalls={() => {
                setCurrentTab('calls');
              }}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogsPage />
          )}
        </main>
      </div>

      {selectedCall && (
        <CallDetailModal
          record={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminLayout />
    </AuthProvider>
  );
};
