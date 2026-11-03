import React, { useState } from 'react';
import { Contact, formatPhoneNumber } from '@call-agent/shared';
import { Search, Phone, Star, User } from 'lucide-react';

interface ContactsListProps {
  contacts: Contact[];
  onCallContact: (contact: Contact) => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({ contacts, onCallContact }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phoneNumber.includes(term) ||
      (c.department && c.department.toLowerCase().includes(term)) ||
      (c.role && c.role.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 pt-2">
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search candidates, colleagues..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Contacts Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-1">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No contacts match your search.
          </div>
        ) : (
          filteredContacts.map(c => (
            <div
              key={c.id}
              className="py-2.5 flex items-center justify-between group hover:bg-slate-900/60 rounded-xl px-2 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-300">
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{c.name}</span>
                    {c.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400">{c.role || c.department}</div>
                  <div className="text-[11px] font-mono text-slate-500">{formatPhoneNumber(c.phoneNumber)}</div>
                </div>
              </div>

              <button
                onClick={() => onCallContact(c)}
                className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center transition border border-emerald-500/30"
                title={`Call ${c.name}`}
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
