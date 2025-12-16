import { useState } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Mail, Phone, User, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContactEditModal } from '@/components/contacts/ContactEditModal'
import { ContactCreateModal } from '@/components/contacts/ContactCreateModal'
import type { Contact } from '@/types/database'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'

export function Contacts() {
  const { chatwootUrl } = useChatwootUrl()
  const { contacts, isLoading, searchQuery, setSearchQuery, updateContact, createContact } = useContacts()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'with-email' | 'with-phone'>('all')
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsEditModalOpen(true)
  }

  const handleSaveContact = (contactId: number, updates: Partial<Contact>) => {
    updateContact({ contactId, updates })
  }

  // Apply client-side filters
  const filteredContacts = contacts.filter((contact) => {
    if (selectedFilter === 'with-email') return contact.email
    if (selectedFilter === 'with-phone') return contact.phone
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contatos</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gerencie todos os seus contatos do Chatwoot
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                Todos ({contacts.length})
              </Button>
              <Button
                variant={selectedFilter === 'with-email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('with-email')}
              >
                Com Email
              </Button>
              <Button
                variant={selectedFilter === 'with-phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('with-phone')}
              >
                Com Telefone
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-slate-500">Carregando contatos...</p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum contato encontrado
            </h3>
            <p className="text-sm text-slate-500">
              {searchQuery
                ? 'Tente ajustar sua busca'
                : 'Ainda não há contatos cadastrados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card 
              key={contact.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleEditContact(contact)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {contact.profile_url ? (
                    <img
                      src={contact.profile_url}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold text-slate-900 truncate">
                      {contact.name}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      ID: {contact.chatwoot_id}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Phone */}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 truncate">{contact.phone}</span>
                  </div>
                )}

                {/* Email */}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 truncate">{contact.email}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(
                        `${chatwootUrl}/app/accounts/1/contacts/${contact.chatwoot_id}`,
                        '_blank'
                      )
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no Chatwoot
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredContacts.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          Mostrando {filteredContacts.length} de {contacts.length} contatos
        </div>
      )}

      {/* Edit Modal */}
      <ContactEditModal
        contact={editingContact}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveContact}
      />

      {/* Create Modal */}
      <ContactCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createContact}
      />
    </div>
  )
}
