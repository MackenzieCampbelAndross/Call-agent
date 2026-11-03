import React, { useState, useEffect } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { EmployeeProfileBar } from './components/EmployeeProfileBar';
import { Dialpad } from './components/Dialpad';
import { ContactsList } from './components/ContactsList';
import { CallHistory } from './components/CallHistory';
import { OutgoingCallScreen } from './components/OutgoingCallScreen';
import { IncomingCallScreen } from './components/IncomingCallScreen';
import { OngoingCallScreen } from './components/OngoingCallScreen';
import { RecordDetailModal } from './components/RecordDetailModal';
import { SimulationControlDeck } from './components/SimulationControlDeck';

import { getTelephonyAdapter } from './telephony/adapterFactory';
import { BrowserMockTelephonyAdapter } from './telephony/BrowserMockTelephonyAdapter';
import { callSessionManager } from './domain/CallSessionManager';
import { callRecordStore } from './domain/CallRecordStore';
import { syncManager, NetworkCondition } from './domain/SyncManager';

import {
  CallRecord,
  Contact,
  EmployeeIdentity,
  CallStateEvent
} from '@call-agent/shared';

import { Phone, Users, Clock, Sparkles } from 'lucide-react';

const EMPLOYEES: EmployeeIdentity[] = [
  {
    employeeId: 'EMP-TEST',
    name: 'Test User',
    department: 'Quality Assurance',
    email: 'test@gmail.com',
    employeeCode: 'HR-TEST-001'
  },
  {
    employeeId: 'EMP-1001',
    name: 'Talent Acquisition Team',
    department: 'People Operations',
    email: 'recruiting@purpledrive.com',
    employeeCode: 'HR-TA-1001'
  }
];

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    name: 'David Miller',
    phoneNumber: '+14155552671',
    company: 'Applicant (Senior Android Engineer)',
    department: 'Engineering Candidate',
    role: 'Candidate - Stage 3 Technical',
    email: 'david.miller@example.com',
    isFavorite: true
  },
  {
    id: 'cnt-2',
    name: 'Jessica Reynolds',
    phoneNumber: '+16505558932',
    company: 'Applicant (Staff Mobile Lead)',
    department: 'Engineering Candidate',
    role: 'Candidate - Final Offer Review',
    email: 'jreynolds.dev@example.org',
    isFavorite: true
  },
  {
    id: 'cnt-3',
    name: 'Robert Chen',
    phoneNumber: '+14085554109',
    company: 'PurpleDrive Tech',
    department: 'Hiring Manager (Mobile)',
    role: 'VP of Mobile Engineering',
    email: 'rchen@purpledrive.internal',
    isFavorite: false
  },
  {
    id: 'cnt-4',
    name: 'Amanda Brooks',
    phoneNumber: '+12065557712',
    company: 'Talent Partner Agency',
    department: 'External Recruiting Partner',
    role: 'Senior Executive Sourcer',
    email: 'abrooks@talentsphere.io',
    isFavorite: false
  },
  {
    id: 'cnt-5',
    name: 'Liam Gallagher',
    phoneNumber: '+13125559045',
    company: 'Applicant (HR Analyst)',
    department: 'People Ops Candidate',
    role: 'Candidate - Initial Screen',
    email: 'liam.g@example.com',
    isFavorite: false
  }
];

export const App: React.FC = () => {
  const adapter = getTelephonyAdapter() as BrowserMockTelephonyAdapter;

  const [activeTab, setActiveTab] = useState<'dialpad' | 'recents' | 'contacts'>('dialpad');
  const [selectedSim, setSelectedSim] = useState<number>(0);
  const [activeCall, setActiveCall] = useState<CallStateEvent | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<CallRecord | null>(null);
  const [employee, setEmployee] = useState<EmployeeIdentity>(EMPLOYEES[0]);
  const [networkCondition, setNetworkCondition] = useState<NetworkCondition>('ONLINE');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [completedNotice, setCompletedNotice] = useState<CallRecord | null>(null);

  // Subscribe to CallSessionManager updates
  useEffect(() => {
    const unsubSession = callSessionManager.subscribe(() => {
      setActiveCall(callSessionManager.getActiveCall());
      setCallDuration(callSessionManager.getDurationSeconds());
      const lastCompleted = callSessionManager.getLastCompletedRecord();
      if (lastCompleted) {
        setCompletedNotice(lastCompleted);
        callSessionManager.clearLastCompletedRecord();
      }
    });

    const unsubStore = callRecordStore.subscribe(() => {
      setRecords(callRecordStore.getAllRecords());
    });

    const unsubSync = syncManager.subscribe(() => {
      setIsSyncing(syncManager.isSyncing());
      setNetworkCondition(syncManager.getNetworkCondition());
    });

    setRecords(callRecordStore.getAllRecords());
    syncManager.setEmployee(employee);

    return () => {
      unsubSession();
      unsubStore();
      unsubSync();
    };
  }, []);

  const handleToggleSim = () => {
    setSelectedSim(prev => (prev === 0 ? 1 : 0));
  };

  const handleSelectEmployee = (emp: EmployeeIdentity) => {
    setEmployee(emp);
    syncManager.setEmployee(emp);
  };

  const handleInitiateCall = async (phoneNumber: string, simSlotIndex: number, contactName?: string) => {
    await adapter.initiateCall({
      phoneNumber,
      simSlotIndex,
      contactName
    });
  };

  const handleCallContact = (contact: Contact) => {
    handleInitiateCall(contact.phoneNumber, selectedSim, contact.name);
  };

  const handleAnswer = async () => {
    if (activeCall) {
      await adapter.answerCall(activeCall.callId);
    }
  };

  const handleReject = async () => {
    if (activeCall) {
      await adapter.rejectCall(activeCall.callId);
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      await adapter.endCall(activeCall.callId);
    }
  };

  const handleToggleMute = async (muted: boolean) => {
    await adapter.setMuted(muted);
  };

  const handleToggleSpeaker = async (speaker: boolean) => {
    await adapter.setSpeaker(speaker);
  };

  const handleToggleHold = async (hold: boolean) => {
    await adapter.setHold(hold);
  };

  // Determine active call screen overlay
  const isIncomingRinging = activeCall?.state === 'RINGING' && activeCall?.direction === 'INCOMING';
  const isOutgoingProgress = (activeCall?.state === 'DIALING' || (activeCall?.state === 'RINGING' && activeCall?.direction === 'OUTGOING'));
  const isCallActive = activeCall?.state === 'ACTIVE' || activeCall?.state === 'HOLDING';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-8">
      {/* Top Banner & Header */}
      <header className="max-w-6xl mx-auto w-full mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                PurpleDrive HR Cellular Dialer
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-950 text-brand-300 border border-brand-800">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Native Android Telecom InCallService Engine with Browser Testing Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono">Mode: Browser Testing</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-xs text-purple-300 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual SIM Enabled</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Mobile Phone on Left, Simulation Control Deck on Right */}
      <main className="max-w-6xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Left Column: Realistic Smartphone Container */}
        <div className="shrink-0">
          <MobileFrame activeSimLabel={selectedSim === 0 ? 'SIM 1 HR' : 'SIM 2 BYOD'}>
            {/* Top HR Identity Bar */}
            <EmployeeProfileBar
              employee={employee}
              networkCondition={networkCondition}
              isSyncing={isSyncing}
              onOpenSyncDetails={() => {
                if (records.length > 0) setSelectedAuditRecord(records[0]);
              }}
            />

            {/* Completed Call Alert Toast */}
            {completedNotice && (
              <div
                onClick={() => {
                  setSelectedAuditRecord(completedNotice);
                  setCompletedNotice(null);
                }}
                className="mx-3 mt-2 p-2.5 bg-brand-950/90 border border-brand-700/80 rounded-xl text-xs flex items-center justify-between cursor-pointer shadow-lg animate-in fade-in"
              >
                <div>
                  <span className="font-bold text-white block">Call Record Created</span>
                  <span className="text-[10px] text-brand-300 block">
                    {completedNotice.outcome} • {completedNotice.connectedDurationSeconds}s • Tap to audit
                  </span>
                </div>
                <span className="text-[10px] font-bold text-brand-400 underline">Audit</span>
              </div>
            )}

            {/* Screen Content based on Active Tab */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === 'dialpad' && (
                <Dialpad
                  onInitiateCall={(phone, sim) => handleInitiateCall(phone, sim)}
                  selectedSim={selectedSim}
                  onToggleSim={handleToggleSim}
                />
              )}

              {activeTab === 'recents' && (
                <CallHistory
                  records={records}
                  onSelectRecord={r => setSelectedAuditRecord(r)}
                  onRedial={(phone, sim) => handleInitiateCall(phone, sim)}
                />
              )}

              {activeTab === 'contacts' && (
                <ContactsList
                  contacts={INITIAL_CONTACTS}
                  onCallContact={handleCallContact}
                />
              )}

              {/* Full Screen Call Overlays */}
              {isIncomingRinging && activeCall && (
                <IncomingCallScreen
                  call={activeCall}
                  onAnswer={handleAnswer}
                  onReject={handleReject}
                />
              )}

              {isOutgoingProgress && activeCall && (
                <OutgoingCallScreen
                  call={activeCall}
                  onEndCall={handleEndCall}
                  onToggleMute={handleToggleMute}
                  onToggleSpeaker={handleToggleSpeaker}
                />
              )}

              {isCallActive && activeCall && (
                <OngoingCallScreen
                  call={activeCall}
                  durationSeconds={callDuration}
                  onEndCall={handleEndCall}
                  onToggleMute={handleToggleMute}
                  onToggleSpeaker={handleToggleSpeaker}
                  onToggleHold={handleToggleHold}
                />
              )}
            </div>

            {/* Bottom Tab Bar Navigation */}
            <nav className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-30">
              <button
                onClick={() => setActiveTab('recents')}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === 'recents' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-[10px]">Recents</span>
              </button>

              <button
                onClick={() => setActiveTab('dialpad')}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === 'dialpad' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span className="text-[10px]">Keypad</span>
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === 'contacts' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-[10px]">Contacts</span>
              </button>
            </nav>
          </MobileFrame>
        </div>

        {/* Right Column: Simulation Control Deck */}
        <div className="w-full max-w-lg flex flex-col gap-4">
          <SimulationControlDeck
            adapter={adapter}
            employees={EMPLOYEES}
            activeEmployee={employee}
            onSelectEmployee={handleSelectEmployee}
            networkCondition={networkCondition}
            onSetNetworkCondition={cond => syncManager.setNetworkCondition(cond)}
            isCallActive={isCallActive}
          />
        </div>
      </main>

      {/* Record Audit Inspection Modal */}
      {selectedAuditRecord && (
        <RecordDetailModal
          record={selectedAuditRecord}
          onClose={() => setSelectedAuditRecord(null)}
        />
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full mt-6 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
        PurpleDrive Mobile Engineering • Production Android Cellular Dialer & Browser Simulation Harness
      </footer>
    </div>
  );
};
