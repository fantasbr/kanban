import { useState, useEffect } from 'react'
import { Clock, Save, Ban, Settings2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BlocksManager } from './BlocksManager'
import { PreferencesEditor } from './PreferencesEditor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

import type { Instructor, WeeklySchedule } from '@/types/database'
import { toast } from 'sonner'

interface InstructorConfigModalProps {
  instructor: Instructor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { lesson_duration_minutes: number; weekly_schedule: WeeklySchedule | null }) => Promise<void>
}

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

export function InstructorConfigModal({ instructor, open, onOpenChange, onSave }: InstructorConfigModalProps) {
  const [lessonDuration, setLessonDuration] = useState(60)
  const [schedule, setSchedule] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Sync state with instructor prop whenever it changes
  useEffect(() => {
    if (instructor) {
      setLessonDuration(instructor.lesson_duration_minutes || 60)
      
      const newSchedule = daysOfWeek.reduce((acc, day) => {
        const existing = instructor.weekly_schedule?.[day.key as keyof WeeklySchedule]
        acc[day.key] = {
          enabled: !!existing,
          start: existing?.start || '08:00',
          end: existing?.end || '18:00',
        }
        return acc
      }, {} as Record<string, { enabled: boolean; start: string; end: string }>)
      
      setSchedule(newSchedule)
    }
  }, [instructor])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Build weekly schedule object
      const weeklySchedule: WeeklySchedule = {} as WeeklySchedule
      let hasAnyDay = false

      daysOfWeek.forEach((day) => {
        if (schedule[day.key].enabled) {
          weeklySchedule[day.key as keyof WeeklySchedule] = {
            enabled: true,
            start: schedule[day.key].start,
            end: schedule[day.key].end,
          }
          hasAnyDay = true
        }
      })

      await onSave({
        lesson_duration_minutes: lessonDuration,
        weekly_schedule: hasAnyDay ? weeklySchedule : null,
      })

      toast.success('Configurações salvas com sucesso!')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDay = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
      },
    }))
  }

  const updateTime = (dayKey: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }))
  }

  if (!instructor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações - {instructor.full_name}</DialogTitle>
          <DialogDescription>
            Configure horários de trabalho e duração padrão das aulas
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="mt-6 flex flex-col h-full">
          <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none space-x-2">
            <TabsTrigger 
              value="schedule"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
            >
              <Clock className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
            <TabsTrigger 
              value="duration"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
            >
              <Clock className="h-4 w-4 mr-2" />
              Duração
            </TabsTrigger>
            <TabsTrigger 
              value="blocks"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
            >
              <Ban className="h-4 w-4 mr-2" />
              Bloqueios
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Preferências
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 flex-1 min-h-0">
            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Horário Semanal</h3>
                  <p className="text-sm text-muted-foreground">
                    Defina a disponibilidade padrão para cada dia da semana.
                  </p>
                </div>
              </div>

              <div className="space-y-0 divide-y border rounded-lg bg-card">
                {Object.keys(schedule).length > 0 && daysOfWeek.map((day) => (
                  <div key={day.key} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Switch
                        id={`schedule-${day.key}`}
                        checked={schedule[day.key].enabled}
                        onCheckedChange={() => toggleDay(day.key)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label 
                        htmlFor={`schedule-${day.key}`} 
                        className={`font-medium cursor-pointer text-sm ${schedule[day.key].enabled ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {day.label}
                      </Label>
                    </div>

                    {schedule[day.key].enabled ? (
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                            <Clock className="h-3 w-3 text-muted-foreground opacity-50" />
                          </div>
                          <Input
                            type="time"
                            value={schedule[day.key].start}
                            onChange={(e) => updateTime(day.key, 'start', e.target.value)}
                            className="w-28 pl-8 h-9 text-sm font-medium bg-background border-muted-foreground/20 focus:border-primary transition-all rounded-md"
                          />
                        </div>
                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">até</span>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                            <Clock className="h-3 w-3 text-muted-foreground opacity-50" />
                          </div>
                          <Input
                            type="time"
                            value={schedule[day.key].end}
                            onChange={(e) => updateTime(day.key, 'end', e.target.value)}
                            className="w-28 pl-8 h-9 text-sm font-medium bg-background border-muted-foreground/20 focus:border-primary transition-all rounded-md"
                          />
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-normal bg-muted/50">
                        Indisponível
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Duration Tab */}
            <TabsContent value="duration" className="space-y-4 mt-0">
              <div>
                <h3 className="text-lg font-medium mb-1">Duração da Aula</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure a duração padrão para novos agendamentos.
                </p>

                <div className="space-y-6 max-w-sm">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="duration" className="min-w-[80px]">Duração</Label>
                    <div className="relative flex-1">
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        max="240"
                        step="15"
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(parseInt(e.target.value) || 60)}
                        className="pl-4 pr-12"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">min</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[30, 45, 60, 90, 120].map((dur) => (
                      <Button
                        key={dur}
                        type="button"
                        variant={lessonDuration === dur ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLessonDuration(dur)}
                        className="w-full"
                      >
                        {dur < 60 ? `${dur} min` : `${dur / 60}h${dur % 60 ? (dur % 60) + 'm' : ''}`}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="blocks" className="space-y-4 mt-0">
              <BlocksManager instructorId={instructor.id} />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-0">
              <PreferencesEditor key={instructor.id} instructorId={instructor.id} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
