import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserMockTelephonyAdapter } from '../src/telephony/BrowserMockTelephonyAdapter';
import { calculateConnectedDurationSeconds, validateCallRecord } from '@call-agent/shared';

describe('BrowserMockTelephonyAdapter Simulated Workflows', () => {
  let adapter: BrowserMockTelephonyAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = new BrowserMockTelephonyAdapter();
    adapter.setSimulationConfig({
      ringDelayMs: 500,
      answerDelayMs: 1000,
      unansweredTimeoutMs: 3000
    });
  });

  it('correctly simulates successful outgoing call lifecycle and generates valid record', async () => {
    const states: string[] = [];
    adapter.subscribeCallState(e => states.push(e.state));

    const callId = await adapter.initiateCall({
      phoneNumber: '+14155552671',
      contactName: 'David Miller',
      simSlotIndex: 0
    });

    expect(callId).toBeDefined();
    expect(states).toContain('DIALING');

    // Advance to RINGING
    vi.advanceTimersByTime(500);
    expect(states).toContain('RINGING');

    // Advance to ACTIVE (answered)
    vi.advanceTimersByTime(1000);
    expect(states).toContain('ACTIVE');

    // Talk for 15 seconds
    vi.advanceTimersByTime(15000);

    // End call locally
    await adapter.endCall(callId);
    expect(states).toContain('DISCONNECTED');
  });

  it('simulates outgoing call rejected / busy', async () => {
    adapter.setSimulationConfig({ outgoingBehavior: 'REJECT_BUSY' });
    let lastOutcome: string | null = null;
    let disconnected = false;

    adapter.subscribeCallState(e => {
      if (e.state === 'DISCONNECTED') {
        disconnected = true;
        lastOutcome = e.outcome || null;
      }
    });

    const callId = await adapter.initiateCall({ phoneNumber: '1234567890' });
    vi.advanceTimersByTime(500); // Ringing
    vi.advanceTimersByTime(2500); // Busy disconnect

    expect(disconnected).toBe(true);
    expect(lastOutcome).toBe('BUSY');
  });

  it('simulates unanswered outgoing call timeout', async () => {
    adapter.setSimulationConfig({ outgoingBehavior: 'UNANSWERED_TIMEOUT', unansweredTimeoutMs: 3000 });
    let lastOutcome: string | null = null;

    adapter.subscribeCallState(e => {
      if (e.state === 'DISCONNECTED') {
        lastOutcome = e.outcome || null;
      }
    });

    await adapter.initiateCall({ phoneNumber: '1234567890' });
    vi.advanceTimersByTime(500); // Ringing
    vi.advanceTimersByTime(3000); // Timeout

    expect(lastOutcome).toBe('UNANSWERED');
  });

  it('simulates incoming call answered by user', async () => {
    let currentState = '';
    adapter.subscribeCallState(e => { currentState = e.state; });

    const callId = adapter.simulateIncomingCall('+16505558932', 'Jessica Reynolds', 0);
    expect(currentState).toBe('RINGING');

    await adapter.answerCall(callId);
    expect(currentState).toBe('ACTIVE');

    await adapter.endCall(callId);
    expect(currentState).toBe('DISCONNECTED');
  });

  it('simulates incoming call unanswered (MISSED call)', () => {
    let outcome: string | null = null;
    adapter.subscribeCallState(e => {
      if (e.state === 'DISCONNECTED') outcome = e.outcome || null;
    });

    adapter.simulateIncomingCall('+18005550199', 'Recruiter', 0);
    vi.advanceTimersByTime(15000); // Ring timeout

    expect(outcome).toBe('MISSED');
  });

  it('simulates mid-call cellular network drop (INTERRUPTED)', async () => {
    let outcome: string | null = null;
    adapter.subscribeCallState(e => {
      if (e.state === 'DISCONNECTED') outcome = e.outcome || null;
    });

    const callId = await adapter.initiateCall({ phoneNumber: '5551234' });
    vi.advanceTimersByTime(500); // Ringing
    vi.advanceTimersByTime(1000); // Active

    adapter.simulateMidCallInterruption();
    expect(outcome).toBe('INTERRUPTED');
  });
});
