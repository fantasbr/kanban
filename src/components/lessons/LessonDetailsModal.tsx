import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useLessons } from '@/hooks/useLessons'
import { LessonStatusBadge } from './LessonStatusBadge'
import type { Lesson } from '@/types/database'
import type { ContractStatus } from '@/types/contract'
import { Calendar, Clock, User, Car, MapPin, FileText, Ban, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LessonDetailsModalProps {
  lesson: Lesson | null
  open: boolean
  onOpenChange: (open: boolean) => void
  contractStatus?: ContractStatus
}

export function LessonDetailsModal({ lesson, open, onOpenChange, contractStatus = 'active' }: LessonDetailsModalProps) {
  const { cancelLesson, markNoShow, markCompleted, isCancelling, isMarkingNoShow, isMarkingCompleted } = useLessons()

  // Action dialogs state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showNoShowDialog, setShowNoShowDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

  // Form state
  const [cancellationReason, setCancellationReason] = useState('')
  const [instructorNotes, setInstructorNotes] = useState('')

  if (!lesson) return null

  const handleCancel = async () => {
    if (!cancellationReason.trim()) return
    
    try {
      await cancelLesson({ id: lesson.id, reason: cancellationReason })
      setShowCancelDialog(false)
      setCancellationReason('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error canceling lesson:', error)
    }
  }

  const handleNoShow = async () => {
    try {
      await markNoShow({ id: lesson.id, notes: instructorNotes || undefined })
      setShowNoShowDialog(false)
      setInstructorNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error marking no-show:', error)
    }
  }

  const handleComplete = async () => {
    try {
      await markCompleted({ id: lesson.id, notes: instructorNotes || undefined })
      setShowCompleteDialog(false)
      setInstructorNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error marking completed:', error)
    }
  }

  const isScheduled = lesson.status === 'scheduled'
  const isContractActive = contractStatus === 'active'
  const canTakeAction = isScheduled && isContractActive

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Aula</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between pb-4 border-b">
              <LessonStatusBadge status={lesson.status} />
              <span className="text-sm text-muted-foreground">
                ID: #{lesson.id}
              </span>
            </div>

            {/* Main Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Data da Aula</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(lesson.lesson_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.start_time} - {lesson.end_time} ({lesson.duration_minutes} minutos)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Aluno</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.contract_items?.contracts?.clients?.full_name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Instrutor</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.instructors?.full_name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Veículo</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.vehicles?.plate || 'N/A'} - {lesson.vehicles?.model || 'N/A'}
                    </p>
                  </div>
                </div>

                {lesson.topic && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tópico</p>
                      <p className="text-sm text-muted-foreground">{lesson.topic}</p>
                    </div>
                  </div>
                )}

                {lesson.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Local</p>
                      <p className="text-sm text-muted-foreground">{lesson.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {lesson.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Observações</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {lesson.notes}
                </p>
              </div>
            )}

            {/* Instructor Notes (if completed or no-show) */}
            {lesson.instructor_notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Notas do Instrutor</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {lesson.instructor_notes}
                </p>
              </div>
            )}

            {/* Cancellation Info */}
            {lesson.status === 'cancelled' && lesson.cancellation_reason && (
              <div className="pt-4 border-t bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Motivo do Cancelamento
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {lesson.cancellation_reason}
                </p>
                {lesson.cancelled_at && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Cancelada em {format(new Date(lesson.cancelled_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                )}
              </div>
            )}

            {/* Audit Info */}
            <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
              <p>Agendada em {format(new Date(lesson.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}</p>
              {lesson.completed_at && (
                <p>Concluída em {format(new Date(lesson.completed_at), "dd/MM/yyyy 'às' HH:mm")}</p>
              )}
              {lesson.no_show_at && (
                <p>Falta registrada em {format(new Date(lesson.no_show_at), "dd/MM/yyyy 'às' HH:mm")}</p>
              )}
            </div>
          </div>

          {/* Non-Active Contract Warning */}
          {isScheduled && !isContractActive && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Contrato {contractStatus === 'completed' ? 'Concluído' : 'Inativo'}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Não é possível alterar o status desta aula pois o contrato está {contractStatus === 'completed' ? 'concluído' : 'inativo'}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {canTakeAction && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="w-full sm:w-auto"
              >
                <Ban className="h-4 w-4 mr-2" />
                Desmarcar Aula
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNoShowDialog(true)}
                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Marcar Falta
              </Button>
              <Button
                variant="default"
                onClick={() => setShowCompleteDialog(true)}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar Concluída
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desmarcar Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação devolverá o crédito da aula para o aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Motivo do Cancelamento *</Label>
            <Textarea
              id="reason"
              placeholder="Informe o motivo do cancelamento..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!cancellationReason.trim() || isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? 'Desmarcando...' : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Show Dialog */}
      <AlertDialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar Falta</AlertDialogTitle>
            <AlertDialogDescription>
              O crédito NÃO será devolvido ao aluno. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre a falta..."
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingNoShow}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNoShow}
              disabled={isMarkingNoShow}
              className="bg-red-600 hover:bg-red-700"
            >
              {isMarkingNoShow ? 'Registrando...' : 'Confirmar Falta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Concluída</AlertDialogTitle>
            <AlertDialogDescription>
              O crédito foi consumido. A aula será marcada como realizada com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="complete-notes">Notas do Instrutor (Opcional)</Label>
            <Textarea
              id="complete-notes"
              placeholder="Observações sobre o desempenho do aluno, pontos de melhoria..."
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingCompleted}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={isMarkingCompleted}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarkingCompleted ? 'Concluindo...' : 'Confirmar Conclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
