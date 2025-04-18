//packages/api/src/factory.ts
/**
 * 客户端工厂
 * 用于创建LLM客户端实例
 */
import { LLMClient, ClientConfig } from './types';
import { LLMClientImpl } from './client';
import { LLMProvider, PROVIDER_CONFIG } from './config';
import { isLoggingEnabled } from './utils';

/**
 * 创建LLM客户端
 * 根据配置创建适当的客户端实例
 * 
 * @param config 客户端配置
 * @returns LLM客户端实例
 */
export function createClient(config: ClientConfig): LLMClient {
    if (isLoggingEnabled()) {
        console.log(`[DEBUG] Creating client for provider: ${config.provider}`);
    }

    // 检查是否为已知提供商
    const isKnownProvider = Object.values(LLMProvider).includes(config.provider as LLMProvider);
    
    // 如果不是已知提供商，记录一个日志但继续创建客户端
    if (!isKnownProvider && isLoggingEnabled()) {
        console.log(`[DEBUG] Using custom provider configuration: ${config.provider}`);
    }

    return new LLMClientImpl(config);
}

/**
 * 创建简化的LLM客户端
 * 使用内置的提供商配置创建客户端实例
 * 
 * @param provider 提供商类型
 * @param apiKey API密钥
 * @param options 额外选项
 * @returns LLM客户端实例
 */
export function createLLMClient(
    provider: string,
    apiKey: string,
    options?: {
        model?: string;
        baseUrl?: string;
        endpoints?: {
            chat?: string;
            models?: string;
        };
        [key: string]: any;
    }
): LLMClient {
    // 获取提供商配置
    const providerConfig = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG[LLMProvider.OPENAI];

    // 构建客户端配置
    const clientConfig: ClientConfig = {
        provider,
        apiKey,
        baseUrl: options?.baseUrl || providerConfig.baseUrl,
        model: options?.model || providerConfig.defaultModel,
        endpoints: {
            chat: options?.endpoints?.chat || providerConfig.endpoints.chat,
            models: options?.endpoints?.models || providerConfig.endpoints.models
        },
        auth: { ...providerConfig.auth },
        request: { ...providerConfig.request },
        response: { ...providerConfig.response }
    };

    return createClient(clientConfig);
}