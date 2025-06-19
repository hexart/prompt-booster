//packages/api/src/factory.ts
/**
 * 客户端工厂
 * 用于创建LLM客户端实例
 */
import { LLMClient, ClientConfig } from './types';
import { LLMClientImpl } from './client';
import { DEFAULT_TIMEOUT,PROVIDER_CONFIG } from './config';

/**
 * 创建LLM客户端
 * 根据配置创建适当的客户端实例
 * 
 * @param config 客户端配置
 * @returns LLM客户端实例
 */
export function createClient(config: ClientConfig | {
    provider: string;
    apiKey: string;
    model?: string;
    baseUrl?: string;
    timeout?: number;
    endpoints?: Partial<ClientConfig['endpoints']>;
}): LLMClient {
    // 标准化 provider
    const provider = config.provider.toLowerCase();
    
    // 获取提供商默认配置
    const providerConfig = PROVIDER_CONFIG[provider] || {};
    
    // 智能合并配置
    const finalConfig: ClientConfig = {
        provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || providerConfig.baseUrl,
        model: config.model || providerConfig.defaultModel,
        timeout: config.timeout || providerConfig.timeout || DEFAULT_TIMEOUT,
        endpoints: {
            chat: config.endpoints?.chat || providerConfig.endpoints?.chat,
            models: config.endpoints?.models || providerConfig.endpoints?.models
        },
        // 如果config中没有这些字段，使用providerConfig中的
        auth: (config as ClientConfig).auth || providerConfig.auth,
        request: (config as ClientConfig).request || providerConfig.request,
        response: (config as ClientConfig).response || providerConfig.response
    };

    return new LLMClientImpl(finalConfig);
}