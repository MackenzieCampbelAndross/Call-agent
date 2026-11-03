import { TelephonyAdapter } from './TelephonyAdapter';
import { BrowserMockTelephonyAdapter } from './BrowserMockTelephonyAdapter';

// Global singleton instance for the browser session
let adapterInstance: TelephonyAdapter | null = null;

export function getTelephonyAdapter(): TelephonyAdapter {
  if (!adapterInstance) {
    // Check if running inside native Android bridge (e.g. Capacitor, WebView JS Interface)
    const isNativeAndroid = typeof window !== 'undefined' && (window as unknown as { AndroidBridge?: unknown }).AndroidBridge;

    if (isNativeAndroid) {
      console.log('[TelephonyFactory] Detected native Android execution environment.');
      // Native Android telephony adapter bridge
      adapterInstance = new BrowserMockTelephonyAdapter(); // Placeholder if hybrid, otherwise native Kotlin handles Telecom
    } else {
      console.log('[TelephonyFactory] Initializing BrowserMockTelephonyAdapter for simulated testing.');
      adapterInstance = new BrowserMockTelephonyAdapter();
    }
  }
  return adapterInstance;
}
