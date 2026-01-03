import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Branding {
  id: string
  logo_url: string | null
  favicon_url: string | null
  system_name: string
}

export function useBranding() {
  const queryClient = useQueryClient()

  const brandingQuery = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_branding')
        .select('*')
        .single()
      
      if (error) throw error
      return data as Branding
    },
  })

  const updateBrandingMutation = useMutation({
    mutationFn: async (updates: Partial<Branding>) => {
      if (!brandingQuery.data?.id) {
        throw new Error('Branding ID not found')
      }

      const { data, error } = await supabase
        .from('app_branding')
        .update(updates)
        .eq('id', brandingQuery.data.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true })
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName)
      
      return publicUrl
    },
  })

  const uploadFaviconMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `favicon-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true })
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName)
      
      return publicUrl
    },
  })

  return {
    branding: brandingQuery.data,
    isLoading: brandingQuery.isLoading,
    updateBranding: updateBrandingMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    uploadFavicon: uploadFaviconMutation.mutateAsync,
    isUploading: uploadLogoMutation.isPending || uploadFaviconMutation.isPending,
  }
}
