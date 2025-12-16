import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type AppSetting = Database['public']['Tables']['app_settings']['Row']
type AppSettingInsert = Database['public']['Tables']['app_settings']['Insert']

export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')

      if (error) throw error
      
      // Convert array to object for easier access
      const settings: Record<string, string> = {}
      data?.forEach((setting: AppSetting) => {
        settings[setting.key] = setting.value || ''
      })
      
      return settings
    },
  })

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const settingData: AppSettingInsert = {
        key,
        value,
        updated_at: new Date().toISOString()
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('app_settings')
        .upsert(settingData as any, {
          onConflict: 'key'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  return {
    settings: settingsQuery.data ?? {},
    isLoading: settingsQuery.isLoading,
    updateSetting: updateSettingMutation.mutate,
  }
}
