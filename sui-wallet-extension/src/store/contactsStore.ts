import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Contact {
  id: string;
  name: string;
  address: string;
  note?: string;
  isFavorite: boolean;
  createdAt: number;
}

interface ContactsState {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  removeContact: (contactId: string) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  toggleFavorite: (contactId: string) => void;
  importContacts: (contacts: Contact[]) => void;
  exportContacts: () => string;
}

export const useContactsStore = create<ContactsState>()(
  subscribeWithSelector((set, get) => ({
    contacts: JSON.parse(localStorage.getItem('hoh_contacts') || '[]'),

    addContact: (contact) => {
      const { contacts } = get();
      
      // Check if address already exists
      if (contacts.some(c => c.address.toLowerCase() === contact.address.toLowerCase())) {
        throw new Error('Address already exists in contacts');
      }

      const newContact: Contact = {
        ...contact,
        id: `contact_${Date.now()}`,
        createdAt: Date.now(),
        isFavorite: contact.isFavorite || false,
      };

      const newContacts = [...contacts, newContact];
      localStorage.setItem('hoh_contacts', JSON.stringify(newContacts));
      set({ contacts: newContacts });
    },

    removeContact: (contactId) => {
      const { contacts } = get();
      const newContacts = contacts.filter(c => c.id !== contactId);
      localStorage.setItem('hoh_contacts', JSON.stringify(newContacts));
      set({ contacts: newContacts });
    },

    updateContact: (contactId, updates) => {
      const { contacts } = get();
      const newContacts = contacts.map(c =>
        c.id === contactId ? { ...c, ...updates } : c
      );
      localStorage.setItem('hoh_contacts', JSON.stringify(newContacts));
      set({ contacts: newContacts });
    },

    toggleFavorite: (contactId) => {
      const { contacts } = get();
      const newContacts = contacts.map(c =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      );
      localStorage.setItem('hoh_contacts', JSON.stringify(newContacts));
      set({ contacts: newContacts });
    },

    importContacts: (importedContacts) => {
      const { contacts } = get();
      
      // Merge imported contacts, avoiding duplicates
      const existingAddresses = new Set(contacts.map(c => c.address.toLowerCase()));
      const newContacts = importedContacts.filter(c => !existingAddresses.has(c.address.toLowerCase()));
      
      const mergedContacts = [...contacts, ...newContacts.map((c, index) => ({
        ...c,
        id: `imported_${Date.now()}_${index}`,
        createdAt: Date.now(),
      }))];
      
      localStorage.setItem('hoh_contacts', JSON.stringify(mergedContacts));
      set({ contacts: mergedContacts });
    },

    exportContacts: () => {
      const { contacts } = get();
      
      const headers = ['Name', 'Address', 'Note', 'Favorite', 'Created'];
      const rows = contacts.map(c => [
        `"${c.name}"`,
        `"${c.address}"`,
        `"${c.note || ''}"`,
        `"${c.isFavorite ? 'Yes' : 'No'}"`,
        `"${new Date(c.createdAt).toLocaleString()}"`,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      return csvContent;
    },
  }))
);
