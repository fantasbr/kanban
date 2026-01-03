import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface PermissionGuardProps {
  require: 'view' | 'create' | 'edit' | 'admin'
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ require, children, fallback }: PermissionGuardProps) {
  const { permissions, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  const hasPermission = {
    view: permissions.canView,
    create: permissions.canCreate,
    edit: permissions.canEdit,
    admin: permissions.isAdmin
  }[require]

  if (!hasPermission) {
    return fallback ?? (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-600">Você não tem permissão para acessar este recurso.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
