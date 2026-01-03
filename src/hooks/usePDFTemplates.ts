import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PDFTemplate } from '@/types/database'

export function usePDFTemplates() {
  const queryClient = useQueryClient()

  // Fetch all templates
  const templatesQuery = useQuery({
    queryKey: ['pdf-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_pdf_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PDFTemplate[]
    },
  })

  // Get template by company and type
  const useTemplateByCompanyAndType = (companyId: number | undefined, templateType: 'contract' | 'receipt') => {
    return useQuery({
      queryKey: ['pdf-templates', companyId, templateType],
      queryFn: async () => {
        if (!companyId) return null

        const { data, error } = await supabase
          .from('erp_pdf_templates')
          .select('*')
          .eq('company_id', companyId)
          .eq('template_type', templateType)
          .single()

        if (error) {
          // If no template found, return null (not an error)
          if (error.code === 'PGRST116') return null
          throw error
        }
        return data as PDFTemplate
      },
      enabled: !!companyId,
    })
  }

  // Create or update template
  const upsertTemplateMutation = useMutation({
    mutationFn: async (template: Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('erp_pdf_templates')
        // @ts-expect-error - Supabase type inference issue
        .upsert(
          {
            ...template,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'company_id,template_type',
          }
        )
        .select()
        .single()

      if (error) throw error
      return data as PDFTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] })
    },
  })

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erp_pdf_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] })
    },
  })

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    upsertTemplate: upsertTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    isUpserting: upsertTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    useTemplateByCompanyAndType,
  }
}
