import { useState, useEffect } from 'react'
import { Clock, Save } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
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

        <Tabs defaultValue="schedule" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="duration">
              <Clock className="h-4 w-4 mr-2" />
              Duração da Aula
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Horário de Trabalho Semanal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure os dias e horários em que este instrutor está disponível para dar aulas
              </p>

              <div className="space-y-3">
                {Object.keys(schedule).length > 0 && daysOfWeek.map((day) => (
                  <Card key={day.key} className={schedule[day.key].enabled ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={schedule[day.key].enabled}
                            onCheckedChange={() => toggleDay(day.key)}
                          />
                          <Label className="font-medium min-w-[120px]">
                            {day.label}
                          </Label>
                        </div>

                        {schedule[day.key].enabled && (
                          <div className="flex items-center gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Início</Label>
                              <Input
                                type="time"
                                value={schedule[day.key].start}
                                onChange={(e) => updateTime(day.key, 'start', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            <span className="text-muted-foreground">até</span>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Fim</Label>
                              <Input
                                type="time"
                                value={schedule[day.key].end}
                                onChange={(e) => updateTime(day.key, 'end', e.target.value)}
                                className="w-32"
                              />
                            </div>
                          </div>
                        )}

                        {!schedule[day.key].enabled && (
                          <span className="text-sm text-muted-foreground">Folga</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Duration Tab */}
          <TabsContent value="duration" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Duração Padrão da Aula</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define a duração padrão das aulas deste instrutor. Você pode alterar isso ao agendar cada aula individualmente.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="duration" className="min-w-[100px]">Duração</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(parseInt(e.target.value) || 60)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    <strong>Sugestões comuns:</strong>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonDuration(30)}
                    >
                      30min
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonDuration(45)}
                    >
                      45min
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonDuration(60)}
                    >
                      1h
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonDuration(90)}
                    >
                      1h30
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonDuration(120)}
                    >
                      2h
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
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
