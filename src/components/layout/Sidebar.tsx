import { Link, useLocation } from 'react-router-dom'
import { Home, Users, BarChart3, Clock, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Kanban', href: '/', icon: Home },
  { name: 'Contatos', href: '/contacts', icon: Users },
  { name: 'Inteligência', href: '/dashboard', icon: BarChart3 },
  { name: 'Histórico', href: '/history', icon: Clock },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen w-56 flex-col bg-slate-900 text-white border-r border-slate-800">
      {/* Logo/Brand */}
      <div className="flex h-14 items-center justify-center border-b border-slate-800 px-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Vibe CRM
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
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
