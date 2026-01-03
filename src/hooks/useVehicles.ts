import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Vehicle, VehicleCompany } from '@/types/database'

export function useVehicles() {
  const queryClient = useQueryClient()

  // Fetch all vehicles with companies
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data: vehicles, error } = await supabase
        .from('erp_vehicles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch companies for each vehicle
      const vehiclesWithCompanies = await Promise.all(
        (vehicles || []).map(async (vehicle: any) => {
          const { data: vehicleCompanies } = await supabase
            .from('erp_vehicle_companies')
            .select(`
              company_id,
              companies:erp_companies(id, name)
            `)
            .eq('vehicle_id', vehicle.id)

          const companies = (vehicleCompanies || [])
            .map((vc: any) => vc.companies)
            .filter(Boolean)

          return {
            ...vehicle,
            companies,
          } as Vehicle
        })
      )

      return vehiclesWithCompanies
    },
  })

  // Create vehicle with companies
  const createVehicleMutation = useMutation<
    Vehicle,
    Error,
    {
      vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'companies'>
      companyIds: number[]
    }
  >({
    mutationFn: async ({ vehicle, companyIds }) => {
      // Insert vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('erp_vehicles')
        // @ts-expect-error - Supabase type inference issue
        .insert(vehicle)
        .select()
        .single()

      if (vehicleError) throw vehicleError

      // Insert vehicle-company relationships
      if (companyIds.length > 0) {
        const vehicleCompanies = companyIds.map((companyId) => ({
          // @ts-expect-error - Supabase type inference issue
          vehicle_id: vehicleData.id,
          company_id: companyId,
        }))

        const { error: relationError } = await supabase
          .from('erp_vehicle_companies')
          // @ts-expect-error - Supabase type inference issue
          .insert(vehicleCompanies)

        if (relationError) throw relationError
      }

      return vehicleData as Vehicle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  // Update vehicle
  const updateVehicleMutation = useMutation<
    void,
    Error,
    {
      id: number
      vehicle: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'companies'>>
      companyIds?: number[]
    }
  >({
    mutationFn: async ({ id, vehicle, companyIds }) => {
      // Update vehicle
      const { error: vehicleError } = await supabase
        .from('erp_vehicles')
        // @ts-expect-error - Supabase type inference issue
        .update(vehicle)
        .eq('id', id)

      if (vehicleError) throw vehicleError

      // Update companies if provided
      if (companyIds !== undefined) {
        // Delete existing relationships
        await supabase
          .from('erp_vehicle_companies')
          .delete()
          .eq('vehicle_id', id)

        // Insert new relationships
        if (companyIds.length > 0) {
          const vehicleCompanies = companyIds.map((companyId) => ({
            vehicle_id: id,
            company_id: companyId,
          }))

          const { error: relationError } = await supabase
            .from('erp_vehicle_companies')
            // @ts-expect-error - Supabase type inference issue
            .insert(vehicleCompanies)

          if (relationError) throw relationError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  // Delete vehicle (soft delete)
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_vehicles')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  return {
    vehicles: vehiclesQuery.data ?? [],
    isLoading: vehiclesQuery.isLoading,
    createVehicle: createVehicleMutation.mutateAsync,
    updateVehicle: updateVehicleMutation.mutateAsync,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
    isCreating: createVehicleMutation.isPending,
    isUpdating: updateVehicleMutation.isPending,
    isDeleting: deleteVehicleMutation.isPending,
  }
}
