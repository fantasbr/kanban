/**
 * Session Storage Helpers
 * Provides type-safe and validated access to sessionStorage
 */

// Types for session data
export interface PendingDealWon {
  dealId: string;
  stageId: string;
  timestamp: number;
}

// Development mode check
const isDev = import.meta.env.DEV;

/**
 * Conditional logger - only logs details in development
 */
const logError = (message: string, data?: unknown): void => {
  if (isDev && data !== undefined) {
    console.error(message, data);
  } else {
    console.error(message);
  }
};

/**
 * Validates UUID format
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Validates if a value is a valid PendingDealWon object
 */
const isPendingDealWon = (value: unknown): value is PendingDealWon => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('dealId' in value) ||
    !('stageId' in value) ||
    !('timestamp' in value)
  ) {
    return false;
  }

  const data = value as PendingDealWon;
  
  return (
    typeof data.dealId === 'string' &&
    typeof data.stageId === 'string' &&
    typeof data.timestamp === 'number' &&
    data.dealId.trim().length > 0 &&
    data.stageId.trim().length > 0 &&
    isValidUUID(data.dealId) &&
    isValidUUID(data.stageId)
  );
};

/**
 * Safely retrieves and validates PendingDealWon data from sessionStorage
 * 
 * @returns Validated PendingDealWon object if found and valid, null otherwise
 * 
 * @example
 * ```typescript
 * const data = getPendingDealWon();
 * if (data) {
 *   const { dealId, stageId } = data;
 *   // Use validated data
 * }
 * ```
 * 
 * @remarks
 * - Automatically cleans up invalid, corrupted, or expired data
 * - Data expires after 1 hour
 * - Returns null if data is missing, invalid, corrupted, or expired
 * - Safe to call multiple times
 */
export const getPendingDealWon = (): Omit<PendingDealWon, 'timestamp'> | null => {
  try {
    const raw = sessionStorage.getItem('pendingDealWon');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    
    if (!isPendingDealWon(parsed)) {
      logError('Invalid pendingDealWon data structure', parsed);
      sessionStorage.removeItem('pendingDealWon');
      return null;
    }

    // Check if data is expired (1 hour)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > ONE_HOUR) {
      logError('Pending deal data expired, clearing...');
      sessionStorage.removeItem('pendingDealWon');
      return null;
    }

    // Return without timestamp
    const { timestamp: _timestamp, ...data } = parsed;
    return data;
  } catch (error) {
    logError('Failed to parse pendingDealWon from sessionStorage', error);
    sessionStorage.removeItem('pendingDealWon');
    return null;
  }
};

/**
 * Safely stores PendingDealWon data in sessionStorage
 * 
 * @param data - The deal and stage IDs to store
 * @returns true if successful, false otherwise
 * 
 * @example
 * ```typescript
 * const success = setPendingDealWon({ 
 *   dealId: 'uuid-here', 
 *   stageId: 'uuid-here' 
 * });
 * if (!success) {
 *   // Handle storage failure
 * }
 * ```
 * 
 * @remarks
 * - Automatically adds timestamp for expiration tracking
 * - Handles QuotaExceededError by clearing storage and retrying
 * - Returns false if storage fails
 */
export const setPendingDealWon = (
  data: Omit<PendingDealWon, 'timestamp'>
): boolean => {
  try {
    const dataWithTimestamp: PendingDealWon = {
      ...data,
      timestamp: Date.now()
    };
    sessionStorage.setItem('pendingDealWon', JSON.stringify(dataWithTimestamp));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logError('sessionStorage quota exceeded, attempting to clear...');
      sessionStorage.clear();
      try {
        const dataWithTimestamp: PendingDealWon = {
          ...data,
          timestamp: Date.now()
        };
        sessionStorage.setItem('pendingDealWon', JSON.stringify(dataWithTimestamp));
        return true;
      } catch {
        logError('Failed to save after clearing quota');
        return false;
      }
    }
    logError('Failed to save pendingDealWon to sessionStorage', error);
    return false;
  }
};

/**
 * Removes PendingDealWon data from sessionStorage
 * 
 * @example
 * ```typescript
 * clearPendingDealWon();
 * ```
 * 
 * @remarks
 * - Safe to call even if data doesn't exist
 * - Logs errors but doesn't throw
 */
export const clearPendingDealWon = (): void => {
  try {
    sessionStorage.removeItem('pendingDealWon');
  } catch (error) {
    logError('Failed to clear pendingDealWon from sessionStorage', error);
  }
};
