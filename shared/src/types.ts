/**
 * Shared Domain Types and Telephony Interfaces for PurpleDrive HR Cellular Dialer
 * Used across Web Simulation, Backend Sync Server, Admin Dashboard, and Native Android Model parity.
 */

export type CallDirection = 'OUTGOING' | 'INCOMING';

export type CallOutcome =
  | 'COMPLETED'    // Call was answered and finished normally
  | 'MISSED'       // Incoming call rang out without answer
  | 'REJECTED'     // Call was explicitly rejected by user or remote party
  | 'UNANSWERED'   // Outgoing call rang out with no answer from callee
  | 'BUSY'         // Line was busy / user busy
  | 'FAILED'       // Network, radio, or carrier error
  | 'INTERRUPTED'; // Mid-call radio disconnect / dropped connection

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export type CallState =
  | 'IDLE'
  | 'DIALING'      // Outgoing call establishing
  | 'RINGING'      // Incoming call ringing or outgoing ringback
  | 'ACTIVE'       // Audio channel connected
  | 'HOLDING'      // Call on hold
  | 'DISCONNECTED'; // Call ended

export interface EmployeeIdentity {
  employeeId: string;
  name: string;
  department: string;
  email: string;
  employeeCode: string;
  registeredPhoneNumber?: string;
}

export interface EmployeeAccount {
  employeeId: string;
  name: string;
  department: string;
  email: string;
  employeeCode: string;
  registeredPhoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalCalls: number;
    totalDurationSeconds: number;
    lastActiveAt?: number | null;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'EMPLOYEE';
    employeeId?: string;
    registeredPhoneNumber?: string;
    department?: string;
  };
}

export interface SimSlotInfo {
  slotIndex: number; // 0 for SIM 1, 1 for SIM 2
  displayName: string;
  carrierName: string;
  phoneNumber?: string;
  isDefault: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  company?: string;
  department?: string;
  role?: string;
  email?: string;
  isFavorite?: boolean;
}

export interface CallRecord {
  /** Unique RFC-4122 v4 UUID */
  callId: string;

  /** HR Employee Identity */
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  registeredPhoneNumber?: string;

  /** Call Details (Other Party / Contact) */
  phoneNumber: string;
  contactName?: string | null;
  direction: CallDirection;

  /** Timestamps (Unix epoch ms) */
  startedAt: number;
  connectedAt?: number | null;
  endedAt: number;

  /**
   * Connected duration in whole seconds.
   * If never connected (e.g. MISSED, REJECTED, UNANSWERED, FAILED), MUST BE 0.
   */
  connectedDurationSeconds: number;

  /** Call Outcome */
  outcome: CallOutcome;

  /** SIM Slot Details */
  simSlotIndex: number;
  simDisplayName: string;

  /** Synchronization Status */
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncAttemptAt?: number | null;
  syncErrorMessage?: string | null;

  /**
   * True if generated via BrowserMockTelephonyAdapter simulation.
   * False if generated via AndroidTelephonyAdapter on native device.
   */
  isSimulated: boolean;

  /** Optional internal audit notes */
  notes?: string | null;

  /** Device platform metadata */
  deviceInfo?: {
    platform: 'android' | 'browser-mock';
    model?: string;
    osVersion?: string;
    appVersion: string;
  };
}

export interface OutgoingCallRequest {
  phoneNumber: string;
  contactName?: string;
  simSlotIndex?: number;
}

export interface CallStateEvent {
  callId: string;
  state: CallState;
  direction: CallDirection;
  phoneNumber: string;
  contactName?: string | null;
  simSlotIndex: number;
  startedAt: number;
  connectedAt?: number | null;
  endedAt?: number | null;
  outcome?: CallOutcome | null;
  disconnectReason?: string | null;
  isMuted?: boolean;
  isSpeaker?: boolean;
  isOnHold?: boolean;
}

export interface TelephonyAdapter {
  isSimulated(): boolean;
  getSimSlots(): Promise<SimSlotInfo[]>;
  initiateCall(request: OutgoingCallRequest): Promise<string>;
  answerCall(callId: string): Promise<void>;
  rejectCall(callId: string): Promise<void>;
  endCall(callId: string): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  setSpeaker(speaker: boolean): Promise<void>;
  sendDtmf(digit: string): Promise<void>;
  setHold(onHold: boolean): Promise<void>;
  subscribeCallState(listener: (event: CallStateEvent) => void): () => void;
}

export interface SyncPayload {
  employee?: Partial<EmployeeIdentity>;
  records: CallRecord[];
  clientTimestamp: number;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedCount: number;
  syncedCallIds: string[];
  serverTimestamp: number;
}

export interface DashboardStats {
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  answeredCalls: number;
  missedCalls: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  uniqueActiveEmployees: number;
  topEmployees: Array<{
    employeeId: string;
    employeeName: string;
    department: string;
    registeredPhoneNumber: string;
    callCount: number;
    durationSeconds: number;
  }>;
  recentActivity: CallRecord[];
  syncFailuresCount: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorId: string;
  actorEmail?: string;
  actorType: 'ADMIN' | 'EMPLOYEE' | 'SYSTEM';
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}
