import { useSettings } from './useSettings'

const DEFAULT_CHATWOOT_URL = 'https://app.chatwoot.com'

/**
 * Hook to get the configured Chatwoot URL from settings
 * Falls back to the default Chatwoot URL if not configured
 */
export function useChatwootUrl() {
  const { settings, isLoading } = useSettings()
  
  const chatwootUrl = settings.chatwoot_url || DEFAULT_CHATWOOT_URL
  
  // Remove trailing slash if present for consistency
  const normalizedUrl = chatwootUrl.endsWith('/') 
    ? chatwootUrl.slice(0, -1) 
    : chatwootUrl
  
  return {
    chatwootUrl: normalizedUrl,
    isLoading,
  }
}
