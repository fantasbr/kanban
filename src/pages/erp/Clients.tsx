import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { useChatwootUrl } from "@/hooks/useChatwootUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";
import { useContacts } from "@/hooks/useContacts";
import { ContactCreateModal } from "@/components/contacts/ContactCreateModal";
import { ContactEditModal } from "@/components/contacts/ContactEditModal";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import type { Client, Contact } from "@/types/database";
import { getPendingDealWon, clearPendingDealWon } from "@/lib/sessionHelpers";

// Component to show linked contact info

export function Clients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeClients, isLoading } = useClients();
  const { createContact, updateContact } = useContacts();
  const { chatwootUrl } = useChatwootUrl();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContactEditModalOpen, setIsContactEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [createdContactId, setCreatedContactId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // State for search and dialogs

  // useEffect para detectar parâmetros da URL (vindo do Kanban won stage)
  useEffect(() => {
    const contactId = searchParams.get("contactId");
    const fromDeal = searchParams.get("fromDeal");

    if (contactId && fromDeal) {
      const contactIdNum = parseInt(contactId);

      // Defer state updates to avoid cascading renders
      setTimeout(() => {
        setCreatedContactId(contactIdNum);
        setIsDialogOpen(true);
      }, 0);

      // Limpar parâmetros da URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleOpenDialog = (client?: Client) => {
    setEditingClient(client || null);
    setIsDialogOpen(true);
  };



  const handleContactCreated = (contactId: number) => {
    setCreatedContactId(contactId);
    setIsDialogOpen(true);
  };

  const handleEditContact = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact(contact);
    setIsContactEditModalOpen(true);
  };

  const handleSaveContact = (contactId: number, updates: Partial<Contact>) => {
    updateContact({ contactId, updates });
  };



  // Filter clients by search term
  const filteredClients = activeClients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.includes(searchTerm),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsContactModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client: Client) => (
          <Card
            key={client.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/erp/clients/${client.id}`)}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <UserCircle className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {client.full_name}
                </h3>
                <p className="text-sm text-slate-500">CPF: {client.cpf}</p>
                <div className="mt-2 flex items-center gap-1">
                  <Badge
                    variant={client.source === "crm" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {client.source === "crm" ? "CRM" : "Balcão"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {client.contacts?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {client.contacts.phone}
                </div>
              )}
              {client.contacts?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{client.contacts.email}</span>
                </div>
              )}
              {client.city && client.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {client.city} - {client.state}
                </div>
              )}
            </div>

            {/* Chatwoot Button */}
            {client.contact_id &&
              client.contacts &&
              client.contacts.chatwoot_id &&
              client.contacts.chatwoot_id > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `${chatwootUrl}/app/accounts/1/contacts/${client.contacts!.chatwoot_id}`,
                        "_blank",
                      );
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Abrir no Chatwoot
                  </Button>
                </div>
              )}

            {/* Edit Contact Button */}
            {client.contact_id && client.contacts && (
              <div
                className={
                  client.contacts.chatwoot_id && client.contacts.chatwoot_id > 0
                    ? "mt-2"
                    : "mt-4 pt-4 border-t border-slate-200"
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  onClick={(e) => handleEditContact(client.contacts!, e)}
                >
                  <Edit2 className="h-4 w-4" />
                  Editar Contato
                </Button>
              </div>
            )}

            {/* Create Contact Button - for clients without contact */}
            {!client.contact_id && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingClient(client);
                    handleOpenDialog(client);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Criar Contato
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">Nenhum cliente encontrado</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <ClientFormDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={async (newClientId) => {
            setIsDialogOpen(false);
            setEditingClient(null);

            // Check for pending deal won flow
            const pendingDealWon = getPendingDealWon();

            if (pendingDealWon && newClientId) {
              const { dealId, stageId } = pendingDealWon;

              // Combine all updates into a single call for atomicity
              const { error: updateError } = await supabase
                .from("crm_deals")
                // @ts-expect-error - Supabase typing
                .update({
                  existing_client_id: newClientId,
                  stage_id: stageId,
                  won_at: new Date().toISOString(),
                  stage_changed_at: new Date().toISOString(),
                })
                .eq("id", dealId);

              if (updateError) {
                logger.error("Error updating deal:", updateError);
                toast.error("Erro ao atualizar o negócio");
                return;
              } else {
                logger.debug("Deal updated successfully:", {
                  dealId,
                  stageId,
                  won_at: new Date().toISOString(),
                });
              }

              // Clear sessionStorage
              clearPendingDealWon();

              // Redirect to contracts
              toast.success(
                "Cliente cadastrado! Redirecionando para contratos...",
              );
              navigate(
                `/erp/contracts?clientId=${newClientId}&dealId=${dealId}`,
              );
              return;
            }

            // Navigate to client details if it's a new client
            if (newClientId && !editingClient) {
              navigate(`/erp/clients/${newClientId}`);
            }
          }}
          contactId={createdContactId}
          editingClient={editingClient}
        />
      )}



      {/* Contact Create Modal - Modo Balcão */}
      <ContactCreateModal
        open={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setCreatedContactId(null);
        }}
        onCreate={createContact}
        mode="balcao"
        onSuccess={handleContactCreated}
      />

      {/* Contact Edit Modal */}
      <ContactEditModal
        contact={editingContact}
        open={isContactEditModalOpen}
        onClose={() => setIsContactEditModalOpen(false)}
        onSave={handleSaveContact}
      />
    </div>
  );
}
