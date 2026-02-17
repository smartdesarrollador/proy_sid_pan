import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContactCard } from './ContactCard';
import { ContactModal } from './ContactModal';
import { contacts as initialContacts } from '../../data/mockData';

export const ContactsView = () => {
  const { t } = useTranslation('contacts');
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const groups = ['all', 'clients', 'partners', 'vendors', 'personal'];

  const filtered = contacts.filter(c => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = groupFilter === 'all' || c.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const handleSave = (data) => {
    if (editingContact) {
      setContacts(contacts.map(c => c.id === editingContact.id ? { ...editingContact, ...data } : c));
    } else {
      setContacts([{ id: `contact-${Date.now()}`, ...data, avatar: null, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }, ...contacts]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contacts.length} {t('contactsCount')}</p>
        </div>
        <button onClick={() => { setEditingContact(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input w-full pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {groups.map(g => (
            <button key={g} onClick={() => setGroupFilter(g)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${groupFilter === g ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {g === 'all' ? t('groups.all') : t(`groups.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(contact => (
            <ContactCard key={contact.id} contact={contact} onEdit={(c) => { setEditingContact(c); setIsModalOpen(true); }} onDelete={(id) => setContacts(contacts.filter(c => c.id !== id))} />
          ))}
        </div>
      )}

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} contact={editingContact} />
    </div>
  );
};
