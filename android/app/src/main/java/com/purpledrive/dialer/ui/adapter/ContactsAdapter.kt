package com.purpledrive.dialer.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.purpledrive.dialer.databinding.ItemContactBinding
import com.purpledrive.dialer.domain.model.DeviceContact

class ContactsAdapter(
    private val onContactClick: (DeviceContact) -> Unit,
    private val onCallClick: (DeviceContact) -> Unit
) : ListAdapter<DeviceContact, ContactsAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemContactBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemContactBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(contact: DeviceContact) {
            binding.tvContactName.text = contact.name
            binding.tvContactPhone.text = contact.primaryPhoneNumber
            binding.tvAvatarInitials.text = contact.initials

            binding.root.setOnClickListener {
                onContactClick(contact)
            }

            binding.btnQuickCall.setOnClickListener {
                onCallClick(contact)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<DeviceContact>() {
        override fun areItemsTheSame(oldItem: DeviceContact, newItem: DeviceContact): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: DeviceContact, newItem: DeviceContact): Boolean {
            return oldItem == newItem
        }
    }
}
