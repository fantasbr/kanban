import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Tag, DollarSign } from 'lucide-react'
import {
  useAllDealTitles,
  useCreateDealTitle,
  useUpdateDealTitle,
  useDeleteDealTitle,
  useToggleDealTitleActive,
} from '@/hooks/useDealTitles'
import type { DealTitle } from '@/types/database'
import { formatCurrency } from '@/lib/utils'

export function DealTitlesManager() {
  const { data: dealTitles, isLoading } = useAllDealTitles()
  const createMutation = useCreateDealTitle()
  const updateMutation = useUpdateDealTitle()
  const deleteMutation = useDeleteDealTitle()
  const toggleActiveMutation = useToggleDealTitleActive()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<DealTitle | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [valueDefaultInput, setValueDefaultInput] = useState('')

  const handleCreate = () => {
    if (!titleInput.trim()) return

    const value_default = valueDefaultInput.trim() ? parseFloat(valueDefaultInput) : null

    createMutation.mutate(
      { title: titleInput.trim(), value_default },
      {
        onSuccess: () => {
          setTitleInput('')
          setValueDefaultInput('')
          setIsCreateModalOpen(false)
        },
      }
    )
  }

  const handleEdit = () => {
    if (!selectedTitle || !titleInput.trim()) return

    const value_default = valueDefaultInput.trim() ? parseFloat(valueDefaultInput) : null

    updateMutation.mutate(
      { id: selectedTitle.id, title: titleInput.trim(), value_default },
      {
        onSuccess: () => {
          setTitleInput('')
          setValueDefaultInput('')
          setSelectedTitle(null)
          setIsEditModalOpen(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedTitle) return

    deleteMutation.mutate(selectedTitle.id, {
      onSuccess: () => {
        setSelectedTitle(null)
        setIsDeleteDialogOpen(false)
      },
    })
  }

  const handleToggleActive = (title: DealTitle) => {
    toggleActiveMutation.mutate({
      id: title.id,
      is_active: !title.is_active,
    })
  }

  const openEditModal = (title: DealTitle) => {
    setSelectedTitle(title)
    setTitleInput(title.title)
    setValueDefaultInput(title.value_default?.toString() || '')
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (title: DealTitle) => {
    setSelectedTitle(title)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Carregando títulos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Títulos de Negócios</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gerencie os títulos pré-definidos para seus negócios
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Título
        </Button>
      </div>

      {/* Deal Titles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dealTitles?.map((title) => (
          <Card
            key={title.id}
            className={`border-2 transition-all ${
              title.is_active
                ? 'border-blue-200 bg-white hover:border-blue-300'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Tag className="h-5 w-5 text-blue-600 shrink-0" />
                  <CardTitle className="text-lg truncate">{title.title}</CardTitle>
                </div>
                <Badge variant={title.is_active ? 'default' : 'secondary'} className="shrink-0">
                  {title.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {title.value_default && (
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                  <DollarSign className="h-4 w-4" />
                  <span>Valor padrão: <strong>{formatCurrency(title.value_default)}</strong></span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(title)}
                  className="flex-1"
                >
                  {title.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(title)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDeleteDialog(title)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dealTitles?.length === 0 && (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum título cadastrado
            </p>
            <p className="text-sm text-slate-600 mb-4">
              Adicione títulos para organizar seus negócios
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Título
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Adicionar Título</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-title">Título do Negócio</Label>
              <Input
                id="new-title"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Ex: CNH Categoria B"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value-default">Valor Padrão (opcional)</Label>
              <Input
                id="new-value-default"
                type="number"
                step="0.01"
                value={valueDefaultInput}
                onChange={(e) => setValueDefaultInput(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">
                Deixe em branco se não houver valor padrão
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTitleInput('')
                setValueDefaultInput('')
                setIsCreateModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!titleInput.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Editar Título</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título do Negócio</Label>
              <Input
                id="edit-title"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Ex: CNH Categoria B"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value-default">Valor Padrão (opcional)</Label>
              <Input
                id="edit-value-default"
                type="number"
                step="0.01"
                value={valueDefaultInput}
                onChange={(e) => setValueDefaultInput(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">
                Deixe em branco se não houver valor padrão
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTitleInput('')
                setValueDefaultInput('')
                setSelectedTitle(null)
                setIsEditModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!titleInput.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o título "{selectedTitle?.title}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTitle(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
