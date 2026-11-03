/**
 * Duration Calculation and Formatting Utilities
 * Exact algorithms shared across Browser Mock and Native Android apps.
 */

/**
 * Calculates connected call duration in whole seconds.
 * Rules:
 * 1. If call was never connected (connectedAt is null/undefined), duration MUST be 0.
 * 2. If endedAt is before connectedAt (clock skew or invalid timestamps), clamp to 0.
 * 3. Floor division by 1000 to convert epoch ms to integer seconds.
 */
export function calculateConnectedDurationSeconds(
  connectedAt?: number | null,
  endedAt?: number | null
): number {
  if (!connectedAt || !endedAt) {
    return 0;
  }
  const diffMs = endedAt - connectedAt;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / 1000);
}

/**
 * Format duration in seconds to standard MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const hh = hrs.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
