import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Edit, Power, PowerOff } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { UserCreateModal } from '@/components/users/UserCreateModal'
import { UserEditModal } from '@/components/users/UserEditModal'
import type { SystemUser } from '@/hooks/useAuth'

export function UserManagement() {
  const { users, isLoading, toggleUserStatus } = useUsers()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')

  const filteredUsers = users.filter((user) => {
    if (filter === 'active') return user.is_active
    if (filter === 'inactive') return !user.is_active
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando usuários...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários e suas permissões de acesso
          </p>
        </div>
        <PermissionGuard require="admin">
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos ({users.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Ativos ({users.filter((u) => u.is_active).length})
        </Button>
        <Button
          variant={filter === 'inactive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('inactive')}
        >
          Inativos ({users.filter((u) => !u.is_active).length})
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    {!user.is_active && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{user.role?.name || 'Sem role'}</Badge>
                    {user.role && (
                      <div className="flex gap-1 text-xs text-slate-500">
                        {user.role.can_view && <span>👁️ Ver</span>}
                        {user.role.can_create && <span>➕ Criar</span>}
                        {user.role.can_edit && <span>✏️ Editar</span>}
                        {user.role.is_admin && <span>👑 Admin</span>}
                      </div>
                    )}
                  </div>
                </div>

                <PermissionGuard require="admin">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant={user.is_active ? 'outline' : 'default'}
                      size="sm"
                      onClick={() =>
                        toggleUserStatus({ id: user.id, is_active: !user.is_active })
                      }
                      className="gap-2"
                    >
                      {user.is_active ? (
                        <>
                          <PowerOff className="h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </Button>
                  </div>
                </PermissionGuard>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UserCreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      {editingUser && (
        <UserEditModal
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </div>
  )
}
