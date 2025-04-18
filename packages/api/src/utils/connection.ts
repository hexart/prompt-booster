/**
 * 连接工具
 * 处理API连接测试和客户端标识
 */
import { LLMClient, ClientResponse } from '../types';
import { withRetry } from './retry';
import { RETRY_CONFIG } from '../config';

// 日志状态
let loggingEnabled = true;

/**
 * 创建客户端ID
 * 基于连接信息生成唯一标识符
 * 
 * @param baseUrl 基础URL
 * @param apiKey API密钥
 * @returns 客户端唯一标识
 */
export function createClientId(baseUrl: string, apiKey: string): string {
    const apiKeyPrefix = apiKey ? apiKey.substring(0, 4) : 'none';
    return `${baseUrl}:${apiKeyPrefix}`;
}

/**
 * 测试API连接
 * 测试客户端连接是否可用
 * 
 * @param client LLM客户端
 * @param retries 重试次数
 * @returns 连接测试结果
 */
export async function testConnection(
    client: LLMClient,
    retries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<ClientResponse<{ success: boolean; message?: string }>> {
    try {
        // 使用重试机制执行连接测试
        return await withRetry(
            () => client.testConnection(),
            retries,
            RETRY_CONFIG.RETRY_DELAY,
            RETRY_CONFIG.RETRY_MULTIPLIER
        );
    } catch (error: any) {
        if (loggingEnabled) {
            console.error('Connection test error:', error);
        }

        // 安全地提取错误消息
        const errorMessage = error && typeof error === 'object' && 'message' in error ?
            error.message || 'Unknown error occurred' :
            typeof error === 'string' ? error : 'Unknown error occurred';

        return {
            data: {
                success: false,
                message: errorMessage
            }
        };
    }
}

/**
 * 启用API客户端日志
 * 开启日志输出
 */
export function enableApiClientLogs(): void {
    loggingEnabled = true;
}

/**
 * 禁用API客户端日志
 * 关闭日志输出
 */
export function disableApiClientLogs(): void {
    loggingEnabled = false;
}

/**
 * 检查日志是否启用
 * 获取当前日志状态
 * 
 * @returns 日志启用状态
 */
export function isLoggingEnabled(): boolean {
    return loggingEnabled;
}