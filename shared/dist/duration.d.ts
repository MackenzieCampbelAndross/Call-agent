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
export declare function calculateConnectedDurationSeconds(connectedAt?: number | null, endedAt?: number | null): number;
/**
 * Format duration in seconds to standard MM:SS or HH:MM:SS
 */
export declare function formatDuration(seconds: number): string;
