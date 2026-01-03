import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Instructor } from '@/types/database'

export function useInstructors() {
  const queryClient = useQueryClient()

  // Fetch all instructors with companies
  const instructorsQuery = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data: instructors, error } = await supabase
        .from('erp_instructors')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch companies for each instructor
      const instructorsWithCompanies = await Promise.all(
        (instructors || []).map(async (instructor: any) => {
          const { data: instructorCompanies } = await supabase
            .from('erp_instructor_companies')
            .select(`
              company_id,
              companies:erp_companies(id, name)
            `)
            .eq('instructor_id', instructor.id)

          const companies = (instructorCompanies || [])
            .map((ic: any) => ic.companies)
            .filter(Boolean)

          return {
            ...instructor,
            companies,
          } as Instructor
        })
      )

      return instructorsWithCompanies
    },
  })

  // Create instructor with companies
  const createInstructorMutation = useMutation<
    Instructor,
    Error,
    {
      instructor: Omit<Instructor, 'id' | 'created_at' | 'updated_at' | 'companies'>
      companyIds: number[]
    }
  >({
    mutationFn: async ({ instructor, companyIds }) => {
      // Insert instructor
      const { data: instructorData, error: instructorError } = await supabase
        .from('erp_instructors')
        // @ts-expect-error - Supabase type inference issue
        .insert(instructor)
        .select()
        .single()

      if (instructorError) throw instructorError

      // Insert instructor-company relationships
      if (companyIds.length > 0) {
        const instructorCompanies = companyIds.map((companyId) => ({
          // @ts-expect-error - Supabase type inference issue
          instructor_id: instructorData.id,
          company_id: companyId,
        }))

        const { error: relationError } = await supabase
          .from('erp_instructor_companies')
          // @ts-expect-error - Supabase type inference issue
          .insert(instructorCompanies)

        if (relationError) throw relationError
      }

      return instructorData as Instructor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] })
    },
  })

  // Update instructor
  const updateInstructorMutation = useMutation<
    void,
    Error,
    {
      id: number
      instructor: Partial<Omit<Instructor, 'id' | 'created_at' | 'updated_at' | 'companies'>>
      companyIds?: number[]
    }
  >({
    mutationFn: async ({ id, instructor, companyIds }) => {
      // Update instructor
      const { error: instructorError } = await supabase
        .from('erp_instructors')
        // @ts-expect-error - Supabase type inference issue
        .update(instructor)
        .eq('id', id)

      if (instructorError) throw instructorError

      // Update companies if provided
      if (companyIds !== undefined) {
        // Delete existing relationships
        await supabase
          .from('erp_instructor_companies')
          .delete()
          .eq('instructor_id', id)

        // Insert new relationships
        if (companyIds.length > 0) {
          const instructorCompanies = companyIds.map((companyId) => ({
            instructor_id: id,
            company_id: companyId,
          }))

          const { error: relationError } = await supabase
            .from('erp_instructor_companies')
            // @ts-expect-error - Supabase type inference issue
            .insert(instructorCompanies)

          if (relationError) throw relationError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] })
    },
  })

  // Delete instructor (soft delete)
  const deleteInstructorMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_instructors')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] })
    },
  })

  return {
    instructors: instructorsQuery.data ?? [],
    isLoading: instructorsQuery.isLoading,
    createInstructor: createInstructorMutation.mutateAsync,
    updateInstructor: updateInstructorMutation.mutateAsync,
    deleteInstructor: deleteInstructorMutation.mutateAsync,
    isCreating: createInstructorMutation.isPending,
    isUpdating: updateInstructorMutation.isPending,
    isDeleting: deleteInstructorMutation.isPending,
  }
}
