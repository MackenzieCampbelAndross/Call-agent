# PurpleDrive HR Cellular Dialer — Architecture & Operations Manual

A mission-critical enterprise Android dialer built for HR and recruiting teams to make and receive ordinary cellular SIM calls, featuring an integrated high-fidelity browser testing simulation mode.

---

## 1. System Architecture

The application is structured into two interoperable execution modes sharing identical data contracts, validation rules, duration calculation logic, and backend synchronization models:

```
call-agent/
├── shared/              # Shared data contracts, domain validation, duration math
│   ├── src/types.ts     # CallRecord, EmployeeIdentity, TelephonyAdapter interface
│   ├── src/duration.ts  # Deterministic duration calculation & formatting
│   ├── src/validation.ts# 10-point call record contract validation
│   └── src/schema.json  # JSON schema for backend & client parity
├── server/              # Local REST sync backend (Node.js/Express)
│   └── src/index.ts     # /api/calls/sync, /api/calls, /api/contacts, /api/health
├── web/                 # Mode 1: Browser Testing Mode (React + Vite + Tailwind)
│   ├── src/telephony/   # BrowserMockTelephonyAdapter & Audio Synthesizer
│   ├── src/domain/      # CallSessionManager, CallRecordStore, SyncManager
│   └── src/components/  # Mobile frame, Dialpad, InCall screens, Test console
└── android/             # Mode 2: Production Native Android Application (Kotlin)
    └── app/src/main/
        ├── AndroidManifest.xml (Telecom default dialer & InCallService)
        └── java/com/purpledrive/dialer/
            ├── telephony/service/HrInCallService.kt (Native Telecom InCallService)
            ├── telephony/AndroidTelephonyAdapter.kt  (Cellular hardware integration)
            ├── data/local/ (Room SQLite durable store & DAO)
            ├── sync/CallSyncWorker.kt (WorkManager background sync)
            └── ui/ (MainActivity, InCallActivity with live chronometer)
```

### Shared Telephony Contract

Both implementations adhere to the unified `TelephonyAdapter` interface:

```typescript
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
```

- **`BrowserMockTelephonyAdapter`**: Implements complete mock simulation with Web Audio API DTMF, ringback, incoming ringtone chimes, and failure injectors. Flag `isSimulated` is strictly `true`.
- **`AndroidTelephonyAdapter`**: Implements native Android `TelecomManager`, `InCallService`, and `PhoneAccountHandle` controls for dual SIM cellular calling. Flag `isSimulated` is strictly `false`.

---

## 2. Production Call Audit Record Schema

Every call generates an immutable, validated `CallRecord`:

| Field | Type | Description |
|---|---|---|
| `callId` | `UUID v4` | Unique call identifier |
| `employeeId` | `string` | HR Employee ID (e.g. `EMP-1042`) |
| `employeeName` | `string` | Full name of HR representative |
| `employeeDepartment` | `string` | Department / unit (e.g. `Talent Acquisition`) |
| `phoneNumber` | `string` | Dialed or incoming phone number |
| `contactName` | `string?` | Matched directory contact name or null |
| `direction` | `OUTGOING \| INCOMING` | Cellular call direction |
| `startedAt` | `number` (epoch ms) | When dialing or ringing commenced |
| `connectedAt` | `number?` (epoch ms) | When cellular audio channel became active |
| `endedAt` | `number` (epoch ms) | When call disconnected |
| `connectedDurationSeconds` | `number` (integer) | Floor division `(endedAt - connectedAt) / 1000`. Must be `0` if unconnected. |
| `outcome` | `enum` | `COMPLETED`, `MISSED`, `REJECTED`, `UNANSWERED`, `BUSY`, `FAILED`, `INTERRUPTED` |
| `simSlotIndex` | `number` | SIM slot (`0` for SIM 1, `1` for SIM 2) |
| `simDisplayName` | `string` | SIM display label (e.g. `SIM 1 - PurpleDrive HR`) |
| `syncStatus` | `PENDING \| SYNCED \| FAILED` | Synchronization state |
| `syncAttempts` | `number` | Total sync attempts |
| `isSimulated` | `boolean` | `true` in browser testing mode, `false` on native device |

---

## 3. Quick Start & Execution

### Prerequisites
- Node.js (v18+) and npm
- Java JDK 17+ (JDK 21 bundled with Android Studio supported)
- Android SDK (API 34/35)

### Running the Full Development Stack (Browser + Backend)
To launch both the Node.js sync backend and the browser dialer concurrently:
```bash
npm run dev
```
- **Web Dialer UI**: [http://localhost:5173](http://localhost:5173)
- **Sync Backend API**: [http://localhost:3001](http://localhost:3001)

### Running Automated Test Suites
```bash
# Run shared contract and duration calculation tests
npm --workspace=shared run test

# Run browser simulation workflow & offline sync tests
npm --workspace=web run test

# Run native Android JUnit unit tests
npm run test:android
```

---

## 4. Mode 1: Browser Testing Guide

Open [http://localhost:5173](http://localhost:5173). The interface renders a realistic smartphone viewport alongside the **Simulation Control Deck**:

1. **Placing Outgoing Calls**:
   - Use the dialpad to enter digits with DTMF tone audio feedback. Long-press `0` to insert `+`.
   - Toggle SIM card between `SIM 1 (PurpleDrive HR)` and `SIM 2 (Personal)`.
   - Press the green Call button to initiate outgoing dialing.
2. **Testing Callee Outcomes**:
   - In the Simulation Deck, select callee behavior:
     - **Answers Normally**: Ringback tone plays, then transitions to ongoing active call with live chronometer.
     - **Decline / Busy**: Simulates callee declining the call (Outcome: `BUSY`).
     - **Ring Timeout**: Rings for configured duration without answer (Outcome: `UNANSWERED`).
     - **Radio / Network Fail**: Simulates immediate radio registration failure (Outcome: `FAILED`).
3. **Simulating Inbound Calls**:
   - Select candidate (David Miller, Jessica Reynolds) or enter any number in the console.
   - Click **Trigger Inbound Call on Phone**.
   - Ringtone chimes; HR employee can **Accept** or **Decline**.
4. **Testing Mid-Call Interruption**:
   - During an active call, click **Drop Active Call** in the console.
   - The call disconnects with outcome `INTERRUPTED`.
5. **Testing Offline Queue & Recovery**:
   - Toggle network to **Offline**.
   - Complete calls; notice the sync badge changes to amber **Queue (Pending)**.
   - Toggle network to **Online**; pending records automatically sync to the backend and turn green **Synced**.
6. **Auditing Records**:
   - Open **Recents**, click any call to open the **Call Audit Record** modal.
   - Verify contract compliance, exact second calculations, UUID v4 integrity, and raw JSON payload.

---

## 5. Mode 2: Production Native Android Guide

The native Android app compiles genuine Kotlin code integrating with Android Telecom framework APIs:

- **RoleManager Integration**: Implements `RoleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)` on Android 10+ (API 29+) with fallback for legacy OS versions.
- **Telecom InCallService**: `HrInCallService` is declared with `android.permission.BIND_INCALL_SERVICE` and `IN_CALL_SERVICE_UI = true`, capturing real cellular call events.
- **Dual-SIM Support**: Inspects `TelecomManager.callCapablePhoneAccounts` and binds outgoing calls to the selected `PhoneAccountHandle`.
- **Durable Local Storage**: Room SQLite database with `@PrimaryKey callId` ensures zero duplicate call records.
- **Background Sync**: Android `WorkManager` with `NetworkType.CONNECTED` constraint guarantees resilient sync with exponential backoff.

### Compiling the Android Build
```bash
# Build Debug APK
npm run build:android
```
The compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Installing on a Physical Android Phone

1. **Enable Developer Options & USB Debugging** on your Android device:
   - Settings -> About Phone -> Tap "Build Number" 7 times.
   - Settings -> System -> Developer Options -> Enable **USB Debugging**.
2. **Connect the phone via USB** and verify connectivity:
   ```bash
   adb devices
   ```
3. **Install the APK**:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. **Grant Telephony Permissions & Set as Default Phone App**:
   ```bash
   # Set as Default Dialer (or accept prompt inside app)
   adb shell telecom set-default-dialer com.purpledrive.dialer

   # Grant runtime cellular permissions
   adb shell pm grant com.purpledrive.dialer android.permission.CALL_PHONE
   adb shell pm grant com.purpledrive.dialer android.permission.READ_PHONE_STATE
   adb shell pm grant com.purpledrive.dialer android.permission.READ_CALL_LOG
   adb shell pm grant com.purpledrive.dialer android.permission.WRITE_CALL_LOG
   adb shell pm grant com.purpledrive.dialer android.permission.POST_NOTIFICATIONS
   ```
5. **Configure Backend URL**:
   - For local physical device testing on the same Wi-Fi network, point `SyncApiService.DEFAULT_BASE_URL` to your development machine's local IP address (e.g. `http://192.168.1.100:3001/`).

---

## 6. Verification Status & Known Limitations

| Component | Status | Verification Details |
|---|---|---|
| Browser Testing Mode | **VERIFIED** | 100% verified via automated tests & browser interaction. Full state machine, audio synthesizer, and test console operational. |
| Shared Core & Validation | **VERIFIED** | 100% verified with Vitest unit tests (13/13 passing). Contract rules and duration math confirmed. |
| Backend Sync Server | **VERIFIED** | Endpoints `/api/calls/sync`, `/api/calls`, `/api/health` tested and operational with duplicate prevention. |
| Native Android Codebase | **IMPLEMENTED & COMPILED** | Native Kotlin code, Telecom InCallService, Room DB, WorkManager, and Unit Tests implemented. |
| Physical Cellular SIM Testing | **UNVERIFIED ON PHYSICAL HARDWARE** | In compliance with Rule 7, native cellular calling is unverified until deployed and tested on a physical Android smartphone with an active carrier SIM card. |
