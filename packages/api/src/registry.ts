// packages/api/src/registry.ts
/**
 * 提供商注册中心
 * 允许动态注册和管理自定义 LLM 提供商
 */

import { PROVIDER_CONFIG, ProviderConfig } from './config';

/**
 * 提供商注册中心
 * 
 * @description
 * 管理所有 LLM 提供商的配置，包括内置和自定义提供商。
 * 支持动态注册新提供商，无需修改包代码。
 * 
 * @example
 * // 注册自定义提供商
 * ProviderRegistry.register('my-llm', {
 *   providerName: 'My LLM',
 *   baseUrl: 'https://api.my-llm.com/v1',
 *   endpoints: { chat: '/chat', models: '/models' },
 *   defaultModel: 'my-model',
 *   timeout: 60000,
 *   auth: { type: 'bearer' },
 *   request: { type: 'openai_compatible' },
 *   response: { type: 'openai_compatible' }
 * });
 * 
 * // 使用自定义提供商
 * const client = createClient({
 *   provider: 'my-llm',
 *   apiKey: 'xxx'
 * });
 */
export class ProviderRegistry {
  /** 自定义提供商配置存储 */
  private static customProviders = new Map<string, ProviderConfig>();

  /**
   * 注册新提供商
   * 
   * @param providerId - 提供商唯一标识符
   * @param config - 提供商配置
   * 
   * @throws {Error} 当 providerId 已存在时
   * 
   * @example
   * ProviderRegistry.register('custom-openai', {
   *   providerName: 'Custom OpenAI',
   *   baseUrl: 'https://custom.openai.com/v1',
   *   endpoints: { chat: '/chat/completions', models: '/models' },
   *   defaultModel: 'gpt-4',
   *   timeout: 60000,
   *   auth: { type: 'bearer' },
   *   request: { type: 'openai_compatible' },
   *   response: { type: 'openai_compatible' }
   * });
   */
  static register(providerId: string, config: ProviderConfig): void {
    const normalizedId = providerId.toLowerCase();
    
    // 检查是否已存在
    if (PROVIDER_CONFIG[normalizedId] || this.customProviders.has(normalizedId)) {
      throw new Error(`Provider "${providerId}" is already registered`);
    }

    this.customProviders.set(normalizedId, config);
  }

  /**
   * 覆盖已存在的提供商配置
   * 
   * @param providerId - 提供商唯一标识符
   * @param config - 新的提供商配置
   * 
   * @description
   * 允许覆盖内置或已注册的提供商配置。
   * 用于自定义内置提供商的行为。
   * 
   * @example
   * // 覆盖 OpenAI 配置使用代理
   * ProviderRegistry.override('openai', {
   *   ...ProviderRegistry.get('openai'),
   *   baseUrl: 'https://my-proxy.com/openai/v1'
   * });
   */
  static override(providerId: string, config: ProviderConfig): void {
    const normalizedId = providerId.toLowerCase();
    this.customProviders.set(normalizedId, config);
  }

  /**
   * 获取提供商配置
   * 
   * @param providerId - 提供商标识符
   * @returns 提供商配置，如果不存在则返回 undefined
   * 
   * @description
   * 优先返回自定义配置，如果不存在则返回内置配置。
   * 
   * @example
   * const config = ProviderRegistry.get('openai');
   * console.log(config.baseUrl);
   */
  static get(providerId: string): ProviderConfig | undefined {
    const normalizedId = providerId.toLowerCase();
    return this.customProviders.get(normalizedId) || PROVIDER_CONFIG[normalizedId];
  }

  /**
   * 检查提供商是否已注册
   * 
   * @param providerId - 提供商标识符
   * @returns 是否已注册
   * 
   * @example
   * if (ProviderRegistry.has('openai')) {
   *   console.log('OpenAI is available');
   * }
   */
  static has(providerId: string): boolean {
    const normalizedId = providerId.toLowerCase();
    return this.customProviders.has(normalizedId) || !!PROVIDER_CONFIG[normalizedId];
  }

  /**
   * 注销提供商
   * 
   * @param providerId - 提供商标识符
   * @returns 是否成功注销
   * 
   * @description
   * 只能注销自定义提供商，内置提供商无法注销。
   * 
   * @example
   * ProviderRegistry.unregister('my-custom-llm');
   */
  static unregister(providerId: string): boolean {
    const normalizedId = providerId.toLowerCase();
    return this.customProviders.delete(normalizedId);
  }

  /**
   * 列出所有提供商
   * 
   * @returns 所有提供商标识符列表
   * 
   * @example
   * const providers = ProviderRegistry.list();
   * console.log(providers); // ['openai', 'gemini', 'my-custom-llm', ...]
   */
  static list(): string[] {
    return [
      ...Object.keys(PROVIDER_CONFIG),
      ...Array.from(this.customProviders.keys())
    ];
  }

  /**
   * 清除所有自定义提供商
   * 
   * @description
   * 清除所有通过 register() 注册的自定义提供商。
   * 内置提供商不受影响。
   * 
   * @example
   * ProviderRegistry.clear();
   */
  static clear(): void {
    this.customProviders.clear();
  }
}
