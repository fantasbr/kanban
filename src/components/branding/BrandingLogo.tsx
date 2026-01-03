import { useBranding } from '@/hooks/useBranding'

export function BrandingLogo() {
  const { branding, isLoading } = useBranding()

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse bg-gray-700 rounded" />
  }

  if (branding?.logo_url) {
    return (
      <img
        src={branding.logo_url}
        alt={branding.system_name}
        className="h-8 object-contain max-w-[180px]"
      />
    )
  }

  return (
    <span className="text-xl font-bold text-white">
      {branding?.system_name || 'Branca SGI'}
    </span>
  )
}
