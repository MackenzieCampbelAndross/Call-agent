import {
  TelephonyAdapter,
  SimSlotInfo,
  OutgoingCallRequest,
  CallStateEvent,
  CallState,
  CallOutcome
} from '@call-agent/shared';
import { soundEffects } from '../audio/soundEffects';

export type SimulatedOutgoingBehavior =
  | 'ANSWER_NORMAL'       // Rings ~3s then answers
  | 'REJECT_BUSY'         // Rings ~2s then callee declines
  | 'UNANSWERED_TIMEOUT'  // Rings ~10s then times out
  | 'NETWORK_FAIL';       // Fails immediately

export interface SimulationConfig {
  outgoingBehavior: SimulatedOutgoingBehavior;
  ringDelayMs: number;
  answerDelayMs: number;
  unansweredTimeoutMs: number;
}

export class BrowserMockTelephonyAdapter implements TelephonyAdapter {
  private listeners: Set<(event: CallStateEvent) => void> = new Set();
  private activeCall: CallStateEvent | null = null;
  private timerHandle: any = null;

  private config: SimulationConfig = {
    outgoingBehavior: 'ANSWER_NORMAL',
    ringDelayMs: 1500,
    answerDelayMs: 3000,
    unansweredTimeoutMs: 10000
  };

  private simSlots: SimSlotInfo[] = [
    {
      slotIndex: 0,
      displayName: 'SIM 1 - PurpleDrive HR (Work)',
      carrierName: 'Verizon Wireless (Enterprise)',
      phoneNumber: '+14155550100',
      isDefault: true
    },
    {
      slotIndex: 1,
      displayName: 'SIM 2 - Personal (BYOD)',
      carrierName: 'T-Mobile US',
      phoneNumber: '+14155550199',
      isDefault: false
    }
  ];

  public isSimulated(): boolean {
    return true;
  }

  public setSimulationConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getSimulationConfig(): SimulationConfig {
    return { ...this.config };
  }

  public async getSimSlots(): Promise<SimSlotInfo[]> {
    return [...this.simSlots];
  }

  public subscribeCallState(listener: (event: CallStateEvent) => void): () => void {
    this.listeners.add(listener);
    if (this.activeCall) {
      listener({ ...this.activeCall });
    }
    return () => this.listeners.delete(listener);
  }

  private notify(event: CallStateEvent): void {
    this.activeCall = { ...event };
    this.listeners.forEach(fn => fn({ ...event }));
  }

  private clearActiveTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  /**
   * Generates a random v4 UUID for simulation calls
   */
  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Outgoing Call Flow Simulation
   */
  public async initiateCall(request: OutgoingCallRequest): Promise<string> {
    this.clearActiveTimer();
    soundEffects.stopAllTones();

    const callId = this.generateUuid();
    const now = Date.now();
    const simSlot = request.simSlotIndex ?? 0;

    // Step 1: DIALING
    this.notify({
      callId,
      state: 'DIALING',
      direction: 'OUTGOING',
      phoneNumber: request.phoneNumber,
      contactName: request.contactName || null,
      simSlotIndex: simSlot,
      startedAt: now,
      connectedAt: null,
      endedAt: null,
      outcome: null,
      isMuted: false,
      isSpeaker: false,
      isOnHold: false
    });

    // Check immediate network fail behavior
    if (this.config.outgoingBehavior === 'NETWORK_FAIL') {
      this.timerHandle = setTimeout(() => {
        soundEffects.playBusySignal();
        this.notify({
          ...this.activeCall!,
          state: 'DISCONNECTED',
          endedAt: Date.now(),
          outcome: 'FAILED',
          disconnectReason: 'Simulated Cellular Radio / Network Registration Failure'
        });
      }, 1000);
      return callId;
    }

    // Step 2: Transition to RINGING (Ringback tone)
    this.timerHandle = setTimeout(() => {
      soundEffects.startRingback();
      this.notify({
        ...this.activeCall!,
        state: 'RINGING'
      });

      // Step 3: Handle Callee Action according to configured behavior
      if (this.config.outgoingBehavior === 'ANSWER_NORMAL') {
        this.timerHandle = setTimeout(() => {
          soundEffects.stopRingback();
          soundEffects.playConnectedChirp();
          this.notify({
            ...this.activeCall!,
            state: 'ACTIVE',
            connectedAt: Date.now()
          });
        }, this.config.answerDelayMs);
      } else if (this.config.outgoingBehavior === 'REJECT_BUSY') {
        this.timerHandle = setTimeout(() => {
          soundEffects.stopRingback();
          soundEffects.playBusySignal();
          this.notify({
            ...this.activeCall!,
            state: 'DISCONNECTED',
            endedAt: Date.now(),
            outcome: 'BUSY',
            disconnectReason: 'Remote Subscriber Busy / Call Rejected'
          });
        }, 2500);
      } else if (this.config.outgoingBehavior === 'UNANSWERED_TIMEOUT') {
        this.timerHandle = setTimeout(() => {
          soundEffects.stopRingback();
          soundEffects.playBusySignal();
          this.notify({
            ...this.activeCall!,
            state: 'DISCONNECTED',
            endedAt: Date.now(),
            outcome: 'UNANSWERED',
            disconnectReason: 'No Answer from Remote Callee (Ring Timeout)'
          });
        }, this.config.unansweredTimeoutMs);
      }
    }, this.config.ringDelayMs);

    return callId;
  }

  /**
   * Answer incoming call
   */
  public async answerCall(callId: string): Promise<void> {
    if (!this.activeCall || this.activeCall.callId !== callId) return;
    this.clearActiveTimer();
    soundEffects.stopIncomingRingtone();
    soundEffects.playConnectedChirp();

    this.notify({
      ...this.activeCall,
      state: 'ACTIVE',
      connectedAt: Date.now()
    });
  }

  /**
   * Reject incoming call
   */
  public async rejectCall(callId: string): Promise<void> {
    if (!this.activeCall || this.activeCall.callId !== callId) return;
    this.clearActiveTimer();
    soundEffects.stopIncomingRingtone();
    soundEffects.playBusySignal();

    this.notify({
      ...this.activeCall,
      state: 'DISCONNECTED',
      endedAt: Date.now(),
      outcome: 'REJECTED',
      disconnectReason: 'User rejected incoming call'
    });
  }

  /**
   * End ongoing or ringing call
   */
  public async endCall(callId: string): Promise<void> {
    if (!this.activeCall || this.activeCall.callId !== callId) return;
    this.clearActiveTimer();
    soundEffects.stopAllTones();
    soundEffects.playBusySignal();

    const wasConnected = !!this.activeCall.connectedAt;
    const finalOutcome: CallOutcome = wasConnected ? 'COMPLETED' : 'REJECTED';

    this.notify({
      ...this.activeCall,
      state: 'DISCONNECTED',
      endedAt: Date.now(),
      outcome: finalOutcome,
      disconnectReason: 'Call terminated locally by user'
    });
  }

  public async setMuted(muted: boolean): Promise<void> {
    if (!this.activeCall) return;
    this.notify({ ...this.activeCall, isMuted: muted });
  }

  public async setSpeaker(speaker: boolean): Promise<void> {
    if (!this.activeCall) return;
    this.notify({ ...this.activeCall, isSpeaker: speaker });
  }

  public async setHold(onHold: boolean): Promise<void> {
    if (!this.activeCall) return;
    this.notify({
      ...this.activeCall,
      state: onHold ? 'HOLDING' : 'ACTIVE',
      isOnHold: onHold
    });
  }

  public async sendDtmf(digit: string): Promise<void> {
    soundEffects.playDtmfTone(digit);
  }

  // --- Test Simulation Trigger Methods ---

  /**
   * Injects a simulated incoming cellular call from test console
   */
  public simulateIncomingCall(
    phoneNumber: string,
    contactName?: string,
    simSlotIndex: number = 0
  ): string {
    this.clearActiveTimer();
    soundEffects.stopAllTones();

    const callId = this.generateUuid();
    const now = Date.now();

    soundEffects.startIncomingRingtone();

    this.notify({
      callId,
      state: 'RINGING',
      direction: 'INCOMING',
      phoneNumber,
      contactName: contactName || null,
      simSlotIndex,
      startedAt: now,
      connectedAt: null,
      endedAt: null,
      outcome: null,
      isMuted: false,
      isSpeaker: false,
      isOnHold: false
    });

    // Auto-timeout if HR employee does not answer (Missed Call)
    this.timerHandle = setTimeout(() => {
      if (this.activeCall && this.activeCall.callId === callId && this.activeCall.state === 'RINGING') {
        soundEffects.stopIncomingRingtone();
        this.notify({
          ...this.activeCall,
          state: 'DISCONNECTED',
          endedAt: Date.now(),
          outcome: 'MISSED',
          disconnectReason: 'Incoming Call Missed (Ring Timeout)'
        });
      }
    }, 15000);

    return callId;
  }

  /**
   * Simulates sudden mid-call cellular network interruption / tower handover loss
   */
  public simulateMidCallInterruption(): void {
    if (!this.activeCall || this.activeCall.state !== 'ACTIVE') return;
    this.clearActiveTimer();
    soundEffects.stopAllTones();
    soundEffects.playBusySignal();

    this.notify({
      ...this.activeCall,
      state: 'DISCONNECTED',
      endedAt: Date.now(),
      outcome: 'INTERRUPTED',
      disconnectReason: 'Simulated Cellular Radio Signal Lost (Interrupted)'
    });
  }

  /**
   * Reset active state back to IDLE
   */
  public resetToIdle(): void {
    this.clearActiveTimer();
    soundEffects.stopAllTones();
    this.activeCall = null;
    this.listeners.forEach(fn => fn({
      callId: '',
      state: 'IDLE',
      direction: 'OUTGOING',
      phoneNumber: '',
      simSlotIndex: 0,
      startedAt: 0
    }));
  }
}
