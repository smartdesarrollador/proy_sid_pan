import { useState, useMemo } from "react";
import { Search, Plus, Users } from "lucide-react";
import { MOCK_CONTACTS } from "../../data/mockContacts";
import type { ContactGroup } from "../../data/mockContacts";
import ContactCard from "../contacts/ContactCard";

const GROUP_FILTERS: Array<{ value: ContactGroup | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "clients", label: "Clientes" },
  { value: "partners", label: "Socios" },
  { value: "suppliers", label: "Proveedores" },
  { value: "personal", label: "Personal" },
];

export default function ContactsPanel() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<ContactGroup | "all">("all");

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_CONTACTS.filter((contact) => {
      if (
        q &&
        !contact.firstName.toLowerCase().includes(q) &&
        !contact.lastName.toLowerCase().includes(q) &&
        !contact.email.toLowerCase().includes(q) &&
        !contact.company.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (groupFilter !== "all" && contact.group !== groupFilter) return false;
      return true;
    });
  }, [search, groupFilter]);

  const handleEdit = (id: string) => {
    console.log("Edit contact:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete contact:", id);
  };

  const handleNewContact = () => {
    console.log("New contact");
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Contactos</h2>
        <span className="text-xs text-gray-400">{MOCK_CONTACTS.length} contactos</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar contactos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-[#1a1a2e] py-1.5 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Group filter pills */}
      <div className="mb-2 flex gap-1 overflow-x-auto">
        {GROUP_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setGroupFilter(filter.value)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              groupFilter === filter.value
                ? "bg-blue-600 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* New contact button */}
      <button
        onClick={handleNewContact}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={14} />
        Nuevo Contacto
      </button>

      {/* Contacts list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users size={32} className="mb-2" />
            <p className="text-sm">No se encontraron contactos</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredContacts.length} de {MOCK_CONTACTS.length}
      </div>
    </div>
  );
}
