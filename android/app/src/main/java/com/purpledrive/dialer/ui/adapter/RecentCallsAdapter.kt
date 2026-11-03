package com.purpledrive.dialer.ui.adapter

import android.text.format.DateFormat
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.purpledrive.dialer.R
import com.purpledrive.dialer.data.local.CallRecordEntity
import com.purpledrive.dialer.databinding.ItemRecentCallBinding
import java.util.Date

class RecentCallsAdapter(
    private val onCallClick: (CallRecordEntity) -> Unit,
    private val onInfoClick: (CallRecordEntity) -> Unit
) : ListAdapter<CallRecordEntity, RecentCallsAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemRecentCallBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemRecentCallBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(record: CallRecordEntity) {
            val context = binding.root.context
            val isMissed = record.outcome.equals("MISSED", ignoreCase = true) ||
                    record.outcome.equals("REJECTED", ignoreCase = true)

            // Primary display name or number
            val primaryText = if (!record.contactName.isNullOrBlank()) {
                record.contactName
            } else {
                record.phoneNumber
            }
            binding.tvPrimaryTitle.text = primaryText

            // Outcome / Direction visual styling
            if (isMissed) {
                binding.tvPrimaryTitle.setTextColor(ContextCompat.getColor(context, R.color.call_missed))
                binding.ivCallIcon.setColorFilter(ContextCompat.getColor(context, R.color.call_missed))
            } else {
                binding.tvPrimaryTitle.setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                binding.ivCallIcon.setColorFilter(ContextCompat.getColor(context, R.color.text_muted))
            }

            // Duration and Subtitle
            val durationMinutes = record.connectedDurationSeconds / 60
            val durationRemainder = record.connectedDurationSeconds % 60
            val durationStr = String.format("%02d:%02d", durationMinutes, durationRemainder)
            val directionStr = if (record.direction.equals("INCOMING", ignoreCase = true)) "Incoming" else "Outgoing"
            
            binding.tvCallMeta.text = "$directionStr • $durationStr"

            // Timestamp (e.g. 14:22 or Oct 29)
            val date = Date(record.startedAt)
            val timeFormatted = DateFormat.getTimeFormat(context).format(date)
            binding.tvTimestamp.text = timeFormatted

            // Sync Indicator
            if (record.syncStatus.equals("SYNCED", ignoreCase = true)) {
                binding.tvSyncDot.text = "• Synced"
                binding.tvSyncDot.setTextColor(ContextCompat.getColor(context, R.color.accent_purple))
            } else {
                binding.tvSyncDot.text = "• Pending"
                binding.tvSyncDot.setTextColor(ContextCompat.getColor(context, R.color.sync_amber))
            }

            binding.root.setOnClickListener {
                onCallClick(record)
            }

            binding.btnCallDetails.setOnClickListener {
                onInfoClick(record)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<CallRecordEntity>() {
        override fun areItemsTheSame(oldItem: CallRecordEntity, newItem: CallRecordEntity): Boolean {
            return oldItem.callId == newItem.callId
        }

        override fun areContentsTheSame(oldItem: CallRecordEntity, newItem: CallRecordEntity): Boolean {
            return oldItem == newItem
        }
    }
}
