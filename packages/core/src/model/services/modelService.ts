// packages/core/src/services/modelService.ts
import { createClient, testConnection } from '@prompt-booster/api';
import { ModelConfig, CustomInterface, StandardModelType } from '../models/config';
import { API_BASEURL } from '../../config/constants';

/**
 * 测试模型连接
 * @param provider 提供商ID或名称
 * @param apiKey API密钥
 * @param baseUrl 基础URL
 * @param model 模型名称
 * @param endpoint API端点路径
 * @returns 连接测试结果
 */
export async function testModelConnection(
    provider: string,
    apiKey: string,
    baseUrl: string,
    model: string,
    endpoint?: string
) {
    if (!apiKey) {
        return {
            success: false,
            message: '缺少API Key，无法测试连接'
        };
    }

    if (!baseUrl || baseUrl.trim() === '') {
        return {
            success: false,
            message: '缺少API基础URL，无法测试连接'
        };
    }

    try {
        const modelsEndpoint = '/v1/models';

        const client = createClient({
            provider,
            apiKey,
            baseUrl,
            model,
            endpoints: {
                chat: endpoint || '/v1/chat/completions',
                models: modelsEndpoint
            }
        });

        // 测试连接
        return await testConnection(client, 3);
    } catch (error: any) {
        const errorMessage = error instanceof Error ? (error.message || '未知错误') : '未知错误';
        return {
            success: false,
            message: `连接测试出错: ${errorMessage}`
        };
    }
}

/**
 * API Key 掩码函数
 * @param key API密钥
 * @returns 掩码后的API密钥
 */
export function maskApiKey(key: string): string {
    if (!key) return '';

    // 如果密钥长度小于等于8，全部使用星号
    if (key.length <= 8) {
        return '*'.repeat(key.length);
    }

    // 显示前四位和后四位，中间用星号代替
    const visiblePart = 3;
    const prefix = key.substring(0, visiblePart);
    const suffix = key.substring(key.length - visiblePart);
    const maskedLength = key.length - (visiblePart * 2);

    return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
}

/**
 * 检查模型配置是否有效
 * @param config 模型配置
 * @returns 是否有效及错误信息
 */
export function validateModelConfig(config: ModelConfig | CustomInterface): {
    valid: boolean;
    message?: string
} {
    if (!config.apiKey) {
        return { valid: false, message: '请输入API Key' };
    }

    if ('providerName' in config && !config.providerName) {
        return { valid: false, message: '请输入供应商名称' };
    }

    if (!config.model) {
        return { valid: false, message: '请输入模型名称' };
    }

    if (!config.baseUrl || config.baseUrl.trim() === '') {
        return { valid: false, message: '请配置 API 基础 URL' };
    }

    return { valid: true };
}

/**
 * 获取标准模型的默认baseUrl
 * @param modelType 模型类型
 * @returns 默认baseUrl
 */
export function getDefaultBaseUrl(modelType: StandardModelType): string {
    if (modelType.toUpperCase() in API_BASEURL) {
        return API_BASEURL[modelType.toUpperCase() as keyof typeof API_BASEURL] || '';
    }
    return '';
}

/**
 * 准备模型用于UI展示的数据
 * @param configs 模型配置
 * @param customInterfaces 自定义接口
 * @returns 处理后的模型列表
 */
export function prepareModelsForDisplay(
    configs: Record<StandardModelType, ModelConfig>,
    customInterfaces: CustomInterface[]
) {
    // 标准模型
    const standardModels = Object.entries(configs).map(([id, config]) => {
        return {
            id,
            name: `${id} - ${config.model || id}`,
            isStandard: true,
            isEnabled: config.enabled !== false,
            apiKey: config.apiKey,
            model: config.model || '',
            config
        };
    });

    // 自定义接口
    const customModels = customInterfaces.map(item => {
        return {
            id: item.id,
            name: item.name,
            isStandard: false,
            isEnabled: item.enabled !== false,
            apiKey: item.apiKey,
            model: item.model || '',
            providerName: item.providerName,
            config: item
        };
    });

    // 合并并排序 (已启用的排在前面)
    return [...standardModels, ...customModels]
        .sort((a, b) => {
            // 首先按启用状态排序
            if (a.isEnabled && !b.isEnabled) return -1;
            if (!a.isEnabled && b.isEnabled) return 1;

            // 在相同启用状态下，自定义模型排在内置模型前面
            if (!a.isStandard && b.isStandard) return -1;
            if (a.isStandard && !b.isStandard) return 1;

            // 最后按名称排序
            return a.name.localeCompare(b.name);
        });
}