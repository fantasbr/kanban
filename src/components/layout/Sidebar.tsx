import { Link, useLocation } from 'react-router-dom'
import { Home, Users, BarChart3, Clock, Archive, Settings, LogOut, UserCircle, FileText, DollarSign, Car, GraduationCap, Calendar, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { BrandingLogo } from '@/components/branding/BrandingLogo'

const crmNavigation = [
  { name: 'Kanban', href: '/', icon: Home },
  { name: 'Contatos', href: '/contacts', icon: Users },
  { name: 'Inteligência', href: '/dashboard', icon: BarChart3 },
  { name: 'Histórico', href: '/history', icon: Clock },
  { name: 'Deals Arquivados', href: '/deals/history', icon: Archive },
]

const erpNavigation = [
  { name: 'Dashboard', href: '/erp/dashboard', icon: BarChart3 },
  { name: 'Clientes', href: '/erp/clients', icon: UserCircle },
  { name: 'Contratos', href: '/erp/contracts', icon: FileText },
  { name: 'Financeiro', href: '/erp/financial', icon: DollarSign },
  { name: 'Veículos', href: '/erp/vehicles', icon: Car },
  { name: 'Instrutores', href: '/erp/instructors', icon: GraduationCap },
  { name: 'Aulas', href: '/erp/lessons', icon: Calendar },
  { name: 'Agenda Instrutores', href: '/erp/instructor-schedule', icon: CalendarClock },
]

export function Sidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen w-48 flex-col bg-slate-900 text-white border-r border-slate-800">
      {/* Logo/Brand */}
      <div className="flex h-14 items-center justify-center border-b border-slate-800 px-4">
        <BrandingLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* CRM Section */}
        <div>
          <div className="mb-2 px-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              CRM
            </h2>
          </div>
          <div className="space-y-1">
            {crmNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* ERP Section */}
        <div>
          <div className="mb-2 px-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ERP
            </h2>
          </div>
          <div className="space-y-1">
            {erpNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-slate-800 pt-4">
          <Link
            to="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              location.pathname === '/settings'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-800 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium text-slate-300">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
