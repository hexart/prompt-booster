// apps/web/src/utils/apiKeyUtils.ts

/**
 * Mask an API key for display
 * Shows first 3 and last 3 characters, masks the rest with asterisks
 * For keys <= 8 chars, masks everything
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '*'.repeat(key.length);

  const visiblePart = 3;
  const prefix = key.substring(0, visiblePart);
  const suffix = key.substring(key.length - visiblePart);
  const maskedLength = key.length - (visiblePart * 2);

  return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
}

/**
 * Check if a value is a masked API key
 */
export function isMaskedApiKey(value: string): boolean {
  return value.includes('*');
}

/**
 * Unmask an API key by returning the original value
 * This is a helper for form state management
 */
export function unmaskApiKey(maskedValue: string, originalValue: string): string {
  return isMaskedApiKey(maskedValue) ? originalValue : maskedValue;
}
