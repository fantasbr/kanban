import { useState } from 'react'
import { Plus, GraduationCap, Edit, Trash2, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InstructorConfigModal } from '@/components/instructors/InstructorConfigModal'
import { useInstructors } from '@/hooks/useInstructors'
import { useCompanies } from '@/hooks/useERPConfig'
import type { Instructor, CNHCategory, WeeklySchedule } from '@/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

const CNH_CATEGORY_LABELS: Record<CNHCategory, string> = {
  A: 'Categoria A',
  B: 'Categoria B',
  AB: 'Categoria AB',
  C: 'Categoria C',
  D: 'Categoria D',
  E: 'Categoria E',
  AC: 'Categoria AC',
  AD: 'Categoria AD',
  AE: 'Categoria AE',
}

const CNH_CATEGORY_COLORS: Record<CNHCategory, string> = {
  A: 'bg-purple-100 text-purple-700',
  B: 'bg-blue-100 text-blue-700',
  AB: 'bg-indigo-100 text-indigo-700',
  C: 'bg-green-100 text-green-700',
  D: 'bg-yellow-100 text-yellow-700',
  E: 'bg-orange-100 text-orange-700',
  AC: 'bg-pink-100 text-pink-700',
  AD: 'bg-red-100 text-red-700',
  AE: 'bg-teal-100 text-teal-700',
}

// Helper to check credential expiration status
const getCredentialStatus = (expirationDate: string) => {
  const today = new Date()
  const expDate = new Date(expirationDate)
  const daysUntilExpiration = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiration < 0) {
    return { label: 'Vencida', color: 'bg-red-100 text-red-700' }
  } else if (daysUntilExpiration <= 30) {
    return { label: 'Vence em breve', color: 'bg-yellow-100 text-yellow-700' }
  } else {
    return { label: 'Válida', color: 'bg-green-100 text-green-700' }
  }
}

// Helper to format CPF
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return value
}

// Helper to format phone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return value
}

export function Instructors() {
  const { instructors, createInstructor, updateInstructor, deleteInstructor, isLoading, isCreating, isUpdating } = useInstructors()
  const { activeCompanies } = useCompanies()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [configuringInstructor, setConfiguringInstructor] = useState<Instructor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    phone: '',
    email: '',
    address: '',
    cnh: '',
    cnh_category: 'B' as CNHCategory,
    cnh_expiration_date: '',
    credencial_detran: '',
    credencial_expiration_date: '',
    hourly_rate: '',
    photo_url: '',
  })

  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([])

  const handleOpenDialog = (instructor?: Instructor) => {
    if (instructor) {
      setEditingInstructor(instructor)
      setFormData({
        full_name: instructor.full_name,
        cpf: instructor.cpf,
        rg: instructor.rg || '',
        birth_date: instructor.birth_date || '',
        phone: instructor.phone,
        email: instructor.email || '',
        address: instructor.address || '',
        cnh: instructor.cnh,
        cnh_category: instructor.cnh_category,
        cnh_expiration_date: instructor.cnh_expiration_date,
        credencial_detran: instructor.credencial_detran,
        credencial_expiration_date: instructor.credencial_expiration_date,
        hourly_rate: instructor.hourly_rate.toString(),
        photo_url: instructor.photo_url || '',
      })
      setSelectedCompanies(instructor.companies?.map(c => c.id) || [])
    } else {
      setEditingInstructor(null)
      setFormData({
        full_name: '',
        cpf: '',
        rg: '',
        birth_date: '',
        phone: '',
        email: '',
        address: '',
        cnh: '',
        cnh_category: 'B',
        cnh_expiration_date: '',
        credencial_detran: '',
        credencial_expiration_date: '',
        hourly_rate: '',
        photo_url: '',
      })
      setSelectedCompanies([])
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedCompanies.length === 0) {
      toast.error('Selecione pelo menos uma empresa')
      return
    }

    try {
      const instructorData = {
        full_name: formData.full_name,
        cpf: formData.cpf.replace(/\D/g, ''),
        rg: formData.rg || null,
        birth_date: formData.birth_date || null,
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email || null,
        address: formData.address || null,
        cnh: formData.cnh,
        cnh_category: formData.cnh_category,
        cnh_expiration_date: formData.cnh_expiration_date,
        credencial_detran: formData.credencial_detran,
        credencial_expiration_date: formData.credencial_expiration_date,
        hourly_rate: parseFloat(formData.hourly_rate),
        photo_url: formData.photo_url || null,
        is_active: true,
        lesson_duration_minutes: 60, // Default 60 minutes
        weekly_schedule: undefined, // Can be configured later
      }

      if (editingInstructor) {
        await updateInstructor({
          id: editingInstructor.id,
          instructor: instructorData,
          companyIds: selectedCompanies,
        })
        toast.success('Instrutor atualizado com sucesso!')
      } else {
        await createInstructor({
          instructor: instructorData,
          companyIds: selectedCompanies,
        })
        toast.success('Instrutor cadastrado com sucesso!')
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving instructor:', error)
      toast.error('Erro ao salvar instrutor')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este instrutor?')) {
      try {
        await deleteInstructor(id)
        toast.success('Instrutor excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting instructor:', error)
        toast.error('Erro ao excluir instrutor')
      }
    }
  }

  const toggleCompany = (companyId: number) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const handleSaveConfig = async (data: { lesson_duration_minutes: number; weekly_schedule: WeeklySchedule | null }) => {
    if (!configuringInstructor) return

    await updateInstructor({
      id: configuringInstructor.id,
      instructor: {
        lesson_duration_minutes: data.lesson_duration_minutes,
        weekly_schedule: data.weekly_schedule || undefined,
      },
      companyIds: configuringInstructor.companies?.map(c => c.id) || [],
    })
  }

  // Filtered instructors
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch =
      instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.cpf.includes(searchTerm.replace(/\D/g, '')) ||
      instructor.cnh.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || instructor.cnh_category === categoryFilter

    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando instrutores...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Instrutores</h1>
          <p className="text-slate-500 mt-1">Gerencie os instrutores da auto escola</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Instrutor
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Nome, CPF ou CNH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="categoryFilter">Categoria CNH</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="categoryFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="A">Categoria A</SelectItem>
                <SelectItem value="B">Categoria B</SelectItem>
                <SelectItem value="AB">Categoria AB</SelectItem>
                <SelectItem value="C">Categoria C</SelectItem>
                <SelectItem value="D">Categoria D</SelectItem>
                <SelectItem value="E">Categoria E</SelectItem>
                <SelectItem value="AC">Categoria AC</SelectItem>
                <SelectItem value="AD">Categoria AD</SelectItem>
                <SelectItem value="AE">Categoria AE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      {filteredInstructors.length !== instructors.length && (
        <div className="text-sm text-slate-500">
          Mostrando {filteredInstructors.length} de {instructors.length} instrutores
        </div>
      )}

      {/* Instructors Grid */}
      {filteredInstructors.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <GraduationCap className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500">
            {instructors.length === 0 ? 'Nenhum instrutor cadastrado' : 'Nenhum instrutor encontrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstructors.map((instructor) => {
            const credentialStatus = getCredentialStatus(instructor.credencial_expiration_date)
            
            return (
              <Card key={instructor.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{instructor.full_name}</h3>
                      <p className="text-sm text-slate-600">{formatCPF(instructor.cpf)}</p>
                      <p className="text-sm text-slate-600">{formatPhone(instructor.phone)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfiguringInstructor(instructor)}
                        title="Configurar horários"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(instructor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(instructor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={CNH_CATEGORY_COLORS[instructor.cnh_category]}>
                      {CNH_CATEGORY_LABELS[instructor.cnh_category]}
                    </Badge>
                    <Badge className={credentialStatus.color}>
                      {credentialStatus.label}
                    </Badge>
                  </div>

                  {/* Companies */}
                  {instructor.companies && instructor.companies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {instructor.companies.map(company => (
                        <Badge key={company.id} variant="secondary" className="text-xs">
                          {company.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Hourly Rate */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-slate-500">Valor da hora/aula</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(instructor.hourly_rate)}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingInstructor ? 'Editar Instrutor' : 'Novo Instrutor'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do instrutor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-700">Informações Pessoais</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  {/* CPF */}
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>

                  {/* RG */}
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      placeholder="00.000.000-0"
                    />
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - UF"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-700">Informações Profissionais</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* CNH */}
                  <div className="space-y-2">
                    <Label htmlFor="cnh">CNH *</Label>
                    <Input
                      id="cnh"
                      value={formData.cnh}
                      onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                      placeholder="00000000000"
                      required
                    />
                  </div>

                  {/* CNH Category */}
                  <div className="space-y-2">
                    <Label htmlFor="cnh_category">Categoria CNH *</Label>
                    <Select
                      value={formData.cnh_category}
                      onValueChange={(value: CNHCategory) =>
                        setFormData({ ...formData, cnh_category: value })
                      }
                    >
                      <SelectTrigger id="cnh_category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Categoria A</SelectItem>
                        <SelectItem value="B">Categoria B</SelectItem>
                        <SelectItem value="AB">Categoria AB</SelectItem>
                        <SelectItem value="C">Categoria C</SelectItem>
                        <SelectItem value="D">Categoria D</SelectItem>
                        <SelectItem value="E">Categoria E</SelectItem>
                        <SelectItem value="AC">Categoria AC</SelectItem>
                        <SelectItem value="AD">Categoria AD</SelectItem>
                        <SelectItem value="AE">Categoria AE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CNH Expiration */}
                  <div className="space-y-2">
                    <Label htmlFor="cnh_expiration_date">Vencimento CNH *</Label>
                    <Input
                      id="cnh_expiration_date"
                      type="date"
                      value={formData.cnh_expiration_date}
                      onChange={(e) => setFormData({ ...formData, cnh_expiration_date: e.target.value })}
                      required
                    />
                  </div>

                  {/* Credencial DETRAN */}
                  <div className="space-y-2">
                    <Label htmlFor="credencial_detran">Credencial DETRAN *</Label>
                    <Input
                      id="credencial_detran"
                      value={formData.credencial_detran}
                      onChange={(e) => setFormData({ ...formData, credencial_detran: e.target.value })}
                      placeholder="Número da credencial"
                      required
                    />
                  </div>

                  {/* Credencial Expiration */}
                  <div className="space-y-2">
                    <Label htmlFor="credencial_expiration_date">Vencimento Credencial *</Label>
                    <Input
                      id="credencial_expiration_date"
                      type="date"
                      value={formData.credencial_expiration_date}
                      onChange={(e) => setFormData({ ...formData, credencial_expiration_date: e.target.value })}
                      required
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Valor da Hora/Aula (R$) *</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Photo URL */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="photo_url">URL da Foto</Label>
                    <Input
                      id="photo_url"
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Companies */}
              <div className="space-y-2">
                <Label>Empresas * (selecione pelo menos uma)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {activeCompanies.map(company => (
                    <div key={company.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-${company.id}`}
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <label
                        htmlFor={`company-${company.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {company.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <InstructorConfigModal
        instructor={configuringInstructor}
        open={!!configuringInstructor}
        onOpenChange={(open) => !open && setConfiguringInstructor(null)}
        onSave={handleSaveConfig}
      />
    </div>
  )
}
