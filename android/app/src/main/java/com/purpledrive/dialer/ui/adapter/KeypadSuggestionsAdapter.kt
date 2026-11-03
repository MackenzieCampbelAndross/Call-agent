package com.purpledrive.dialer.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.purpledrive.dialer.databinding.ItemKeypadSuggestionBinding
import com.purpledrive.dialer.domain.model.DeviceContact

class KeypadSuggestionsAdapter(
    private val onSuggestionClick: (DeviceContact) -> Unit
) : ListAdapter<DeviceContact, KeypadSuggestionsAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemKeypadSuggestionBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemKeypadSuggestionBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(contact: DeviceContact) {
            binding.tvSuggestionName.text = contact.name
            binding.tvSuggestionNumber.text = contact.primaryPhoneNumber

            binding.root.setOnClickListener {
                onSuggestionClick(contact)
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
