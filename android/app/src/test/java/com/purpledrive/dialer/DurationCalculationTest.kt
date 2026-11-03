package com.purpledrive.dialer

import com.purpledrive.dialer.domain.DurationCalculator
import org.junit.Assert.assertEquals
import org.junit.Test

class DurationCalculationTest {

    @Test
    fun testUnconnectedCallDurationIsZero() {
        val startedAt = 1700000000000L
        val endedAt = 1700000025000L

        // Call never connected: connectedAt is null
        val duration = DurationCalculator.calculateConnectedDurationSeconds(null, endedAt)
        assertEquals(0L, duration)
    }

    @Test
    fun testNullEndedAtReturnsZero() {
        val duration = DurationCalculator.calculateConnectedDurationSeconds(1700000000000L, null)
        assertEquals(0L, duration)
    }

    @Test
    fun testConnectedDurationCalculation() {
        val connectedAt = 1700000010000L
        val endedAt = 1700000055500L // 45.5 seconds

        val duration = DurationCalculator.calculateConnectedDurationSeconds(connectedAt, endedAt)
        assertEquals(45L, duration)
    }

    @Test
    fun testClockSkewProtection() {
        val connectedAt = 1700000050000L
        val endedAt = 1700000040000L // ended before connected

        val duration = DurationCalculator.calculateConnectedDurationSeconds(connectedAt, endedAt)
        assertEquals(0L, duration)
    }

    @Test
    fun testFormatDuration() {
        assertEquals("00:00", DurationCalculator.formatDuration(0L))
        assertEquals("00:05", DurationCalculator.formatDuration(5L))
        assertEquals("01:05", DurationCalculator.formatDuration(65L))
        assertEquals("09:59", DurationCalculator.formatDuration(599L))
        assertEquals("59:59", DurationCalculator.formatDuration(3599L))
        assertEquals("01:00:00", DurationCalculator.formatDuration(3600L))
        assertEquals("01:01:05", DurationCalculator.formatDuration(3665L))
    }
}
