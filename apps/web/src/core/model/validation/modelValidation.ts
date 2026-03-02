// apps/web/src/core/model/validation/modelValidation.ts
import { ModelConfig, CustomInterface } from '../models/config';

/**
 * Translation function type
 */
type TranslationFunction = (key: string, options?: any) => string;

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Model configuration validator class
 * Provides centralized validation logic for model configurations
 */
export class ModelValidator {
  private t?: TranslationFunction;

  constructor(translationFunction?: TranslationFunction) {
    this.t = translationFunction;
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string | undefined): ValidationResult {
    if (!apiKey || apiKey.trim() === '') {
      return {
        valid: false,
        message: this.t?.('toast.validation.apiKeyRequired') || 'API Key required'
      };
    }
    return { valid: true };
  }

  /**
   * Validate provider name (for custom interfaces)
   */
  validateProviderName(providerName: string | undefined, isCustom: boolean): ValidationResult {
    if (isCustom && (!providerName || providerName.trim() === '')) {
      return {
        valid: false,
        message: this.t?.('toast.validation.providerNameRequired') || 'Provider name required'
      };
    }
    return { valid: true };
  }

  /**
   * Validate base URL
   */
  validateBaseUrl(baseUrl: string | undefined): ValidationResult {
    if (!baseUrl || baseUrl.trim() === '') {
      return {
        valid: false,
        message: this.t?.('toast.validation.baseUrlRequired') || 'Base URL required'
      };
    }
    return { valid: true };
  }

  /**
   * Validate model name
   */
  validateModelName(model: string | undefined): ValidationResult {
    if (!model || model.trim() === '') {
      return {
        valid: false,
        message: this.t?.('toast.validation.modelNameRequired') || 'Model name required'
      };
    }
    return { valid: true };
  }

  /**
   * Validate base configuration (without model field)
   */
  validateBaseConfig(config: ModelConfig | CustomInterface): ValidationResult {
    // Validate API key
    const apiKeyResult = this.validateApiKey(config.apiKey);
    if (!apiKeyResult.valid) {
      return apiKeyResult;
    }

    // Validate provider name for custom interfaces
    const isCustom = 'providerName' in config;
    const providerNameResult = this.validateProviderName(
      isCustom ? config.providerName : undefined,
      isCustom
    );
    if (!providerNameResult.valid) {
      return providerNameResult;
    }

    // Validate base URL
    const baseUrlResult = this.validateBaseUrl(config.baseUrl);
    if (!baseUrlResult.valid) {
      return baseUrlResult;
    }

    return { valid: true };
  }

  /**
   * Validate complete model configuration
   */
  validateModelConfig(config: ModelConfig | CustomInterface): ValidationResult {
    // Validate base configuration
    const baseResult = this.validateBaseConfig(config);
    if (!baseResult.valid) {
      return baseResult;
    }

    // Validate model name
    const modelResult = this.validateModelName(config.model);
    if (!modelResult.valid) {
      return modelResult;
    }

    return { valid: true };
  }
}

/**
 * Helper function to create a validator instance and validate
 */
export function validateModelConfig(
  config: ModelConfig | CustomInterface,
  t?: TranslationFunction
): ValidationResult {
  const validator = new ModelValidator(t);
  return validator.validateModelConfig(config);
}

/**
 * Helper function to validate base config only
 */
export function validateBaseConfig(
  config: ModelConfig | CustomInterface,
  t?: TranslationFunction
): ValidationResult {
  const validator = new ModelValidator(t);
  return validator.validateBaseConfig(config);
}
