import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

export function FaviconUpdater() {
  const { branding } = useBranding()

  useEffect(() => {
    if (branding?.favicon_url) {
      const favicon = document.getElementById('favicon') as HTMLLinkElement
      if (favicon) {
        favicon.href = branding.favicon_url
      }
    }
  }, [branding?.favicon_url])

  return null
}
