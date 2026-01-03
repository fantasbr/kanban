import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { SystemUser, SystemRole } from './useAuth'

export function useUsers() {
  const queryClient = useQueryClient()

  // Buscar todos os usuários
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['system-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_users')
        .select(`
          *,
          role:system_roles(*),
          creator:created_by(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SystemUser[]
    }
  })

  // Buscar roles disponíveis
  const { data: roles = [] } = useQuery({
    queryKey: ['system-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_roles')
        .select('*')
        .order('name')

      if (error) throw error
      return data as SystemRole[]
    }
  })

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string
      password: string
      full_name: string
      role_id: string
    }) => {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

      if (authError) throw authError

      // 2. Criar registro em system_users
      const { data, error } = await supabase
        .from('system_users')
        .insert({
          auth_user_id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role_id: userData.role_id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      toast.success('Usuário criado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar usuário: ${error.message}`)
    }
  })

  // Atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Pick<SystemUser, 'full_name' | 'role_id'>>
    }) => {
      const { data, error } = await supabase
        .from('system_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      toast.success('Usuário atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`)
    }
  })

  // Ativar/Desativar usuário
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('system_users')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      toast.success(
        variables.is_active ? 'Usuário ativado com sucesso!' : 'Usuário desativado com sucesso!'
      )
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status: ${error.message}`)
    }
  })

  return {
    users,
    roles,
    isLoading,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    toggleUserStatus: toggleUserStatusMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending
  }
}
