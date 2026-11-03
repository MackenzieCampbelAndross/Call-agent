package com.purpledrive.dialer.telephony

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.telephony.SubscriptionManager
import android.util.Log
import com.purpledrive.dialer.domain.TelephonyAdapter
import com.purpledrive.dialer.domain.model.CallStateEvent
import com.purpledrive.dialer.domain.model.OutgoingCallRequest
import com.purpledrive.dialer.domain.model.SimSlotInfo
import com.purpledrive.dialer.telephony.service.HrInCallService
import kotlinx.coroutines.flow.StateFlow
import java.util.UUID

class AndroidTelephonyAdapter(
    private val context: Context
) : TelephonyAdapter {

    private val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager

    override fun isSimulated(): Boolean = false

    @SuppressLint("MissingPermission")
    override fun getSimSlots(): List<SimSlotInfo> {
        val result = mutableListOf<SimSlotInfo>()
        try {
            val phoneAccounts = telecomManager.callCapablePhoneAccounts
            phoneAccounts.forEachIndexed { index, handle ->
                val account = telecomManager.getPhoneAccount(handle)
                result.add(
                    SimSlotInfo(
                        slotIndex = index,
                        displayName = account?.label?.toString() ?: "SIM ${index + 1}",
                        carrierName = account?.shortDescription?.toString() ?: "Cellular Carrier",
                        isDefault = (index == 0)
                    )
                )
            }
        } catch (e: SecurityException) {
            Log.w(TAG, "Cannot read phone accounts without READ_PHONE_STATE permission", e)
        }

        if (result.isEmpty()) {
            result.add(SimSlotInfo(0, "SIM 1 (Cellular)", "Default Carrier", isDefault = true))
        }
        return result
    }

    @SuppressLint("MissingPermission")
    override fun initiateCall(request: OutgoingCallRequest): String {
        val callId = UUID.randomUUID().toString()
        val uri = Uri.fromParts("tel", request.phoneNumber, null)
        val extras = Bundle().apply {
            putBoolean(TelecomManager.EXTRA_START_CALL_WITH_SPEAKERPHONE, false)

            try {
                val accounts = telecomManager.callCapablePhoneAccounts
                if (request.simSlotIndex in accounts.indices) {
                    putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, accounts[request.simSlotIndex])
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not set SIM account handle", e)
            }
        }

        try {
            telecomManager.placeCall(uri, extras)
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied for placeCall. Falling back to Intent.ACTION_CALL", e)
            val callIntent = Intent(Intent.ACTION_CALL, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(callIntent)
        }

        return callId
    }

    override fun answerCall(callId: String) {
        HrInCallService.answerActiveCall()
    }

    override fun rejectCall(callId: String) {
        HrInCallService.rejectActiveCall()
    }

    override fun endCall(callId: String) {
        HrInCallService.disconnectActiveCall()
    }

    override fun setMuted(muted: Boolean) {
        HrInCallService.setHardwareMuted(muted)
    }

    override fun setSpeaker(speaker: Boolean) {
        HrInCallService.setHardwareSpeaker(speaker)
    }

    override fun sendDtmf(digit: Char) {
        HrInCallService.sendDtmfDigit(digit)
    }

    override fun setHold(onHold: Boolean) {
        HrInCallService.setHold(onHold)
    }

    override fun observeCallState(): StateFlow<CallStateEvent?> {
        return HrInCallService.callStateFlow
    }

    companion object {
        private const val TAG = "AndroidTelephonyAdapter"
    }
}
