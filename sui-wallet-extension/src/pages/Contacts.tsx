import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, StarOff, Download, Upload, Search, AlertCircle } from 'lucide-react';
import { useContactsStore } from '../store/contactsStore';
import { getShortAddress } from '../lib/utils';
import { BottomSheet } from '../components/BottomSheet';

export const ContactsPage = () => {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, toggleFavorite, exportContacts, importContacts } = useContactsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showImportSheet, setShowImportSheet] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    note: '',
    isFavorite: false,
  });
  const [error, setError] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const favorites = filteredContacts.filter(c => c.isFavorite);
  const others = filteredContacts.filter(c => !c.isFavorite);

  const validateAddress = (address: string): boolean => {
    if (!address.startsWith('0x')) return false;
    if (address.length !== 66) return false;
    return true;
  };

  const handleAddContact = () => {
    setError('');

    if (!validateAddress(formData.address)) {
      setError('Invalid Sui address format');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      addContact({
        ...formData,
        createdAt: Date.now(),
      });
      setShowAddSheet(false);
      resetForm();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleExportContacts = () => {
    const csvContent = exportContacts();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hoh_wallet_contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportContacts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n');
        const importedContacts = lines.slice(1).map(line => {
          const parts = line.match(/(".*?"|".*?")/g);
          if (!parts || parts.length < 2) return null;

          return {
            name: parts[0]?.replace(/"/g, '') || '',
            address: parts[1]?.replace(/"/g, '') || '',
            note: parts[2]?.replace(/"/g, '') || '',
            isFavorite: parts[3]?.replace(/"/g, '') === 'Yes',
          };
        }).filter(Boolean) as any[];

        if (importedContacts.length > 0) {
          importContacts(importedContacts);
          alert(`Successfully imported ${importedContacts.length} contacts`);
          setShowImportSheet(false);
        } else {
          throw new Error('No valid contacts found in file');
        }
      } catch (error: any) {
        alert(`Failed to import contacts: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateContact = () => {
    if (!editingContact) return;

    setError('');

    if (!validateAddress(formData.address)) {
      setError('Invalid Sui address format');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      updateContact(editingContact, formData);
      setEditingContact(null);
      resetForm();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      note: '',
      isFavorite: false,
    });
    setError('');
  };

  return (
    <div className="p-4 space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Contacts</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportSheet(true)}
            className="p-2 hover:bg-hoh-card rounded-full"
            title="Import Contacts"
          >
            <Upload size={20} />
          </button>
          <button
            onClick={handleExportContacts}
            disabled={contacts.length === 0}
            className="p-2 hover:bg-hoh-card rounded-lg disabled:opacity-50"
            title="Export Contacts"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => setShowAddSheet(true)}
            className="p-2 bg-hoh-green text-black rounded-lg hover:opacity-90 transition-all"
            title="Add Contact"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-hoh-card text-white pl-10 pr-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
        />
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="bg-hoh-card rounded-xl p-4 text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
            <h3 className="text-sm font-semibold mb-2">No Contacts Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'No contacts match your search' : 'Add your first contact to get started'}
            </p>
            <button
              onClick={() => setShowAddSheet(true)}
              className="bg-hoh-green text-black font-bold py-2 px-4 rounded-xl hover:opacity-90 transition-all"
            >
              Add Contact
            </button>
          </div>
        ) : (
          <>
            {/* Favorites */}
            {favorites.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-gray-400 mb-2">Favorites</h2>
                <div className="space-y-2">
                  {favorites.map(contact => (
                    <div key={contact.id} className="bg-hoh-card rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-hoh-green/20 rounded-full flex items-center justify-center">
                            <span className="text-lg">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-bold">{contact.name}</div>
                            <div className="text-sm text-gray-400 font-mono">{getShortAddress(contact.address)}</div>
                            {contact.note && (
                              <div className="text-xs text-gray-500 mt-1">{contact.note}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFavorite(contact.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg"
                          title="Toggle favorite"
                        >
                          <Star size={16} className={contact.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} fill={contact.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Others */}
            {others.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-gray-400 mb-2">All Contacts</h2>
                <div className="space-y-2">
                  {others.map(contact => (
                    <div key={contact.id} className="bg-hoh-card rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                            <span className="text-lg">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-bold">{contact.name}</div>
                            <div className="text-sm text-gray-400 font-mono">{getShortAddress(contact.address)}</div>
                            {contact.note && (
                              <div className="text-xs text-gray-500 mt-1">{contact.note}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFavorite(contact.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg"
                          title="Add to favorites"
                        >
                          <StarOff size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Contact Modal */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          resetForm();
        }}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact name"
                className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="0x..."
                className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Note (Optional)</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Add a note..."
                className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddSheet(false);
                resetForm();
              }}
              className="flex-1 py-2 px-4 bg-hoh-card text-white font-medium rounded-xl hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={editingContact ? handleUpdateContact : handleAddContact}
              disabled={!formData.name || !formData.address}
              className="flex-1 py-2 px-4 bg-hoh-green text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {editingContact ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Import Contacts Modal */}
      <BottomSheet
        isOpen={showImportSheet}
        onClose={() => setShowImportSheet(false)}
        title="Import Contacts"
      >
        <div className="p-4 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-400">
                Import contacts from a CSV file. The file should contain columns: Name, Address, Note, Favorite, Created.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportContacts}
              className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowImportSheet(false)}
            className="w-full py-2 px-4 bg-hoh-card text-white font-medium rounded-xl hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
