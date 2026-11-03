package com.purpledrive.dialer.domain

object DurationCalculator {

    /**
     * Calculates connected call duration in whole seconds.
     * Rules:
     * 1. If call was never connected (connectedAt is null), duration MUST be 0.
     * 2. If endedAt is before connectedAt (clock skew or invalid timestamps), clamp to 0.
     * 3. Floor division by 1000 to convert epoch ms to integer seconds.
     */
    fun calculateConnectedDurationSeconds(connectedAt: Long?, endedAt: Long?): Long {
        if (connectedAt == null || endedAt == null) {
            return 0L
        }
        val diffMs = endedAt - connectedAt
        if (diffMs <= 0) {
            return 0L
        }
        return diffMs / 1000L
    }

    /**
     * Format duration seconds to MM:SS or HH:MM:SS
     */
    fun formatDuration(seconds: Long): String {
        val safeSeconds = if (seconds < 0) 0L else seconds
        val hrs = safeSeconds / 3600
        val mins = (safeSeconds % 3600) / 60
        val secs = safeSeconds % 60

        return if (hrs > 0) {
            String.format("%02d:%02d:%02d", hrs, mins, secs)
        } else {
            String.format("%02d:%02d", mins, secs)
        }
    }
}
