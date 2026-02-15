import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, TrendingUp, AlertCircle, Gift, Car, Bike } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { LessonStatusBadge } from '@/components/lessons/LessonStatusBadge'
import { LessonDetailsModal } from '@/components/lessons/LessonDetailsModal'
import { AddExtraCreditsModal } from '@/components/contracts/AddExtraCreditsModal'
import type { Contract, Lesson, ContractStatus } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContractLessonsTabProps {
  contract: Contract
}

interface CategoryMetrics {
  category: string
  displayName: string
  icon: React.ReactNode
  totalLessons: number
  completedLessons: number
  scheduledLessons: number
  availableLessons: number
  packageLessons: number
  extraLessons: number
  percentage: number
  itemIds: number[]
}

// Local type for joined data
interface ExtendedContractItem {
  id: number
  contract_id: number
  quantity: number
  is_extra?: boolean
  catalog_items?: {
    is_lesson: boolean
    vehicle_category?: string
  }
}

interface JoinedLesson extends Lesson {
  erp_instructors?: { full_name: string | null }
  erp_vehicles?: { model: string | null; plate: string | null }
}

export function ContractLessonsTab({ contract }: ContractLessonsTabProps) {
  const navigate = useNavigate()
  const [isExtraCreditsModalOpen, setIsExtraCreditsModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Check if contract is active
  const isContractActive = contract.status === 'active'

  // Load contract items with catalog information
  const { data: contractItemsWithCatalog = [] } = useQuery({
    queryKey: ['contract-items-with-catalog', contract.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_items')
        .select(`
          *,
          catalog_items:erp_contract_items_catalog(
            is_lesson,
            vehicle_category
          )
        `)
        .eq('contract_id', contract.id)

      if (error) throw error
      return (data as unknown as ExtendedContractItem[]) || []
    },
  })

  // Filter only lesson items using catalog info
  const lessonItems = contractItemsWithCatalog.filter((item) => 
    item.catalog_items?.is_lesson === true
  )

  // Fetch all lessons for this contract's lesson items
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', 'contract', contract.id, lessonItems.length, 'v3'],
    queryFn: async () => {
      if (!lessonItems || lessonItems.length === 0) {
        return []
      }

      const itemIds = lessonItems.map((i) => Number(i.id)).filter(id => !isNaN(id))
      
      logger.debug('🔍 Fetching lessons for item IDs:', itemIds)
      
      if (itemIds.length === 0) return []

      let query = supabase
        .from('erp_lessons')
        .select(`
          *,
          erp_instructors(full_name),
          erp_vehicles(model, plate)
        `)
      
      if (itemIds.length === 1) {
        query = query.eq('contract_item_id', itemIds[0])
      } else {
        query = query.in('contract_item_id', itemIds)
      }
      
      const { data, error } = await query
        .order('lesson_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) {
        logger.error('❌ Error fetching lessons:', error)
        throw error
      }
      
      logger.debug('✅ Lessons fetched:', data?.length || 0)
      return (data || []) as JoinedLesson[]
    },
    enabled: lessonItems.length > 0,
  })

  // Calculate metrics by category
  const categoryMetrics = useMemo(() => {
    const metricsMap = new Map<string, CategoryMetrics>()

    lessonItems.forEach((item) => {
      const category = item.catalog_items?.vehicle_category || 'other'
      
      if (!metricsMap.has(category)) {
        metricsMap.set(category, {
          category,
          displayName: getCategoryDisplayName(category),
          icon: getCategoryIcon(category),
          totalLessons: 0,
          completedLessons: 0,
          scheduledLessons: 0,
          availableLessons: 0,
          packageLessons: 0,
          extraLessons: 0,
          percentage: 0,
          itemIds: []
        })
      }

      const metrics = metricsMap.get(category)!
      metrics.totalLessons += item.quantity
      metrics.itemIds.push(item.id)
      
      if (item.is_extra) {
        metrics.extraLessons += item.quantity
      } else {
        metrics.packageLessons += item.quantity
      }
    })

    // Calculate completed and scheduled lessons
    logger.debug('🔍 Total lessons:', lessons.length, 'Items:', lessonItems.length)
    lessons.forEach((lesson) => {
      const item = lessonItems.find((i) => i.id === lesson.contract_item_id)
      if (!item) return

      const category = item.catalog_items?.vehicle_category || 'other'
      const metrics = metricsMap.get(category)
      if (!metrics) return

      if (lesson.status === 'completed') {
        metrics.completedLessons++
      } else if (lesson.status === 'scheduled') {
        logger.debug('📅 Found scheduled lesson:', lesson.id, 'category:', category)
        metrics.scheduledLessons++
      }
    })

    // Calculate available lessons and percentage
    logger.debug('📊 Final metrics:', Array.from(metricsMap.entries()))
    metricsMap.forEach((metrics) => {
      metrics.availableLessons = metrics.totalLessons - metrics.completedLessons - metrics.scheduledLessons
      metrics.percentage = metrics.totalLessons > 0 
        ? (metrics.completedLessons / metrics.totalLessons) * 100 
        : 0
    })

    return Array.from(metricsMap.values())
  }, [lessonItems, lessons])

  // Get lessons by category
  const getLessonsByCategory = (category: string) => {
    const categoryItems = lessonItems.filter(
      (item) => (item.catalog_items?.vehicle_category || 'other') === category
    )
    const itemIds = categoryItems.map((item) => item.id)
    return lessons.filter((lesson) => itemIds.includes(lesson.contract_item_id))
  }

  const handleScheduleLesson = () => {
    // Navigate to instructor schedule with client pre-selected
    navigate(`/erp/instructor-schedule?clientId=${contract.client_id}&contractId=${contract.id}`)
  }

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setIsDetailsModalOpen(true)
  }



  return (
    <div className="space-y-6">
      {/* Non-Active Contract Alert */}
      {!isContractActive && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                Contrato {contract.status === 'completed' ? 'Concluído' : 'Inativo'}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Este contrato está em modo somente leitura. Não é possível agendar novas aulas ou alterar o status de aulas existentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary by Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo de Aulas
          </h3>
          {isContractActive && (
            <Button
              onClick={() => setIsExtraCreditsModalOpen(true)}
              variant="outline"
              className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
            >
              <Gift className="h-4 w-4" />
              Comprar Aulas Extras
            </Button>
          )}
        </div>

        {lessonItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Este contrato não possui itens de aula configurados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categoryMetrics.map((metrics) => (
              <Card key={metrics.category}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {metrics.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{metrics.displayName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Total: {metrics.totalLessons} aulas
                          {metrics.extraLessons > 0 && (
                            <span className="text-green-600 ml-1">
                              ({metrics.packageLessons} pacote + {metrics.extraLessons} extras)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {metrics.completedLessons}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ✅ Concluídas
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {metrics.scheduledLessons}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          📅 Agendadas
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {metrics.availableLessons}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          🎯 Disponíveis
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress 
                        value={metrics.percentage} 
                        className="h-3"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {Math.round(metrics.percentage)}% concluído
                        </span>
                        {metrics.availableLessons > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => handleScheduleLesson()}
                            disabled={!isContractActive}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agendar Aula
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {metrics.totalLessons === metrics.completedLessons 
                              ? '✓ Todas concluídas' 
                              : 'Sem créditos disponíveis'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lessons History */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Aulas
        </h3>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Carregando aulas...
            </CardContent>
          </Card>
        ) : lessons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma aula agendada para este contrato
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {categoryMetrics.map((metrics) => {
              const categoryLessons = getLessonsByCategory(metrics.category)
              if (categoryLessons.length === 0) return null

              return (
                <div key={metrics.category}>
                  {/* Category Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {metrics.icon}
                    <h4 className="font-semibold text-base">{metrics.displayName}</h4>
                    <span className="text-sm text-muted-foreground">
                      ({categoryLessons.length} {categoryLessons.length === 1 ? 'aula' : 'aulas'})
                    </span>
                  </div>

                  {/* Lessons List */}
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {categoryLessons.map((lesson) => {
                          const joinedLesson = lesson as JoinedLesson
                          const contractItem = lessonItems.find((item) => item.id === lesson.contract_item_id)
                          const isExtra = contractItem?.is_extra || false
                          
                          return (
                            <div
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson)}
                              className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                  {/* Date and Time */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">
                                      {format(new Date(lesson.lesson_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">
                                      {lesson.start_time}
                                    </span>
                                    {isExtra && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        EXTRA
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Instructor and Vehicle */}
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>
                                      👨‍🏫 {joinedLesson.erp_instructors?.full_name || '-'}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      🚗 {joinedLesson.erp_vehicles?.plate || '-'}
                                    </span>
                                  </div>

                                  {/* Topic */}
                                  {lesson.topic && (
                                    <div className="text-sm text-muted-foreground">
                                      📝 {lesson.topic}
                                    </div>
                                  )}
                                </div>

                                {/* Status Badge */}
                                <div className="shrink-0">
                                  <LessonStatusBadge status={lesson.status} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}

      <LessonDetailsModal
        lesson={selectedLesson}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        contractStatus={contract.status as ContractStatus}
      />

      <AddExtraCreditsModal
        open={isExtraCreditsModalOpen}
        onOpenChange={setIsExtraCreditsModalOpen}
        contractId={contract.id}
      />
    </div>
  )
}

// Helper functions
function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    car: '🚗 CARRO',
    motorcycle: '🏍️ MOTO',
    bus: '🚌 ÔNIBUS',
    truck: '🚚 CAMINHÃO',
    other: '📋 OUTROS'
  }
  return names[category] || category.toUpperCase()
}

function getCategoryIcon(category: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    car: <Car className="h-5 w-5 text-primary" />,
    motorcycle: <Bike className="h-5 w-5 text-primary" />,
    bus: <Car className="h-5 w-5 text-primary" />,
    truck: <Car className="h-5 w-5 text-primary" />,
    other: <Calendar className="h-5 w-5 text-primary" />
  }
  return icons[category] || <Calendar className="h-5 w-5 text-primary" />
}
