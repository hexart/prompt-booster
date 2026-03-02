// apps/web/src/utils/errorHandler.ts
import { toast } from '~/components/ui';
import { TFunction } from 'i18next';

/**
 * Error types for model operations
 */
export type ErrorType = 'validation' | 'auth' | 'connection' | 'response' | 'parse' | 'unknown';

/**
 * Result type for model operations
 */
export interface OperationResult {
  success: boolean;
  errorType?: ErrorType;
  originalError?: string;
}

/**
 * Options for loading toast
 */
export interface LoadingToastOptions {
  loading: string;
  success: string;
  error?: (error: any) => string;
}

/**
 * Get error message based on error type and result
 */
export function getErrorMessage(
  result: OperationResult,
  t: TFunction,
  defaultKey: string = 'toast.connection.testFailed'
): string {
  if (!result.errorType) {
    return t(defaultKey);
  }

  switch (result.errorType) {
    case 'validation':
      // Check specific validation error
      if (result.originalError?.includes('Provider')) {
        return t('toast.validation.providerRequired');
      } else if (result.originalError?.includes('API Key')) {
        return t('toast.validation.apiKeyRequired');
      } else if (result.originalError?.includes('Base URL')) {
        return t('toast.validation.baseUrlRequired');
      } else if (result.originalError?.includes('Model name')) {
        return t('toast.validation.modelNameRequired');
      }
      return result.originalError || t(defaultKey);

    case 'auth':
      return t('toast.connection.authFailed', {
        error: result.originalError || 'Authentication error'
      });

    case 'connection':
      return t('toast.connection.failed', {
        error: result.originalError || 'Connection error'
      });

    case 'unknown':
    default:
      return t('toast.connection.error', {
        error: result.originalError || 'Unknown error'
      });
  }
}

/**
 * Handle operation result with toast notifications
 */
export function handleOperationResult(
  result: OperationResult,
  t: TFunction,
  successMessage: string,
  toastId?: string | number
): void {
  if (result.success) {
    toast.success(successMessage, { id: toastId });
  } else {
    const errorMessage = getErrorMessage(result, t);
    toast.error(errorMessage, { id: toastId });
  }
}

/**
 * Wrapper for async operations with loading toast
 */
export async function withLoadingToast<T>(
  operation: () => Promise<T>,
  t: TFunction,
  messages: {
    loading: string;
    success?: string;
    error?: string;
  },
  onSuccess?: (result: T) => void,
  onError?: (error: any) => void
): Promise<T | undefined> {
  const toastId = toast.loading(messages.loading);

  try {
    const result = await operation();

    if (messages.success) {
      toast.success(messages.success, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }

    onSuccess?.(result);
    return result;
  } catch (error) {
    const errorMessage = messages.error ||
      t('toast.connection.unexpectedError', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

    toast.error(errorMessage, { id: toastId });
    onError?.(error);
    return undefined;
  }
}

/**
 * Handle unexpected errors with toast
 */
export function handleUnexpectedError(
  error: unknown,
  t: TFunction,
  toastId?: string | number
): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const message = t('toast.connection.unexpectedError', { error: errorMessage });

  if (toastId) {
    toast.error(message, { id: toastId });
  } else {
    toast.error(message);
  }
}
