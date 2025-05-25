// packages/api/src/strategies/request.ts
/**
 * 请求格式化策略实现
 * 实现不同LLM服务的请求格式化
 */
import { RequestFormatter, ChatRequest } from '../types';
import { RequestFormatType, DEFAULT_TEMPERATURE } from '../config';
import { getMaxTokensForModel } from '../config';

/**
 * OpenAI兼容请求格式化器
 * 适用于OpenAI及兼容其格式的API
 */
export class OpenAIRequestFormatter implements RequestFormatter {
    /**
     * @param model 模型名称
     */
    constructor(private model: string) { }

    /**
     * 格式化请求为OpenAI格式
     * @param request 标准聊天请求
     * @returns OpenAI格式的请求体
     */
    formatRequest(request: ChatRequest): any {
        // 构建消息数组
        const messages = [];

        // 添加系统消息
        if (request.systemMessage) {
            messages.push({
                role: 'system',
                content: request.systemMessage
            });
        }

        // 添加历史消息
        if (request.history && request.history.length > 0) {
            messages.push(...request.history);
        }

        // 添加用户消息
        messages.push({
            role: 'user',
            content: request.userMessage
        });

        // 获取最大令牌数
        const maxTokens = request.options?.maxTokens || getMaxTokensForModel(this.model);

        // 构建完整请求
        return {
            model: this.model,
            messages,
            temperature: request.options?.temperature || DEFAULT_TEMPERATURE,
            max_tokens: maxTokens
        };
    }
}

/**
 * Gemini请求格式化器
 * 适用于Google的Gemini API
 */
export class GeminiRequestFormatter implements RequestFormatter {
    /**
     * @param model 模型名称
     */
    constructor(private model: string) { }

    /**
     * 格式化请求为Gemini格式
     * @param request 标准聊天请求
     * @returns Gemini格式的请求体
     */
    formatRequest(request: ChatRequest): any {
        // 构建Gemini内容
        const contents = [];

        // 如果有历史对话记录，加入到内容中
        if (request.history && request.history.length > 0) {
            for (const message of request.history) {
                contents.push({
                    role: message.role === 'assistant' ? 'model' : message.role,
                    parts: [{ text: message.content }]
                });
            }
        }

        // 构建用户消息文本
        let userText = request.userMessage;

        // 如果没有历史记录且有系统信息，将系统信息和用户消息合并
        if ((!request.history || request.history.length === 0) && request.systemMessage) {
            userText = `${request.systemMessage}\n\n${request.userMessage}`;
        }

        // 添加用户消息
        contents.push({
            role: 'user',
            parts: [{ text: userText }]
        });

        // 获取最大令牌数
        const maxTokens = request.options?.maxTokens || getMaxTokensForModel(this.model);

        // 构建完整请求
        return {
            contents,
            generationConfig: {
                temperature: request.options?.temperature || DEFAULT_TEMPERATURE,
                maxOutputTokens: maxTokens
            }
        };
    }
}

/**
 * 自定义请求格式化器
 * 支持自定义格式化逻辑
 */
export class CustomRequestFormatter implements RequestFormatter {
    /**
     * @param formatFn 自定义格式化函数
     */
    constructor(private formatFn: (request: ChatRequest) => any) { }

    /**
     * 使用自定义逻辑格式化请求
     * @param request 标准聊天请求
     * @returns 格式化后的请求体
     */
    formatRequest(request: ChatRequest): any {
        return this.formatFn(request);
    }
}

/**
 * 创建请求格式化器
 * 工厂函数，根据类型创建合适的格式化器
 * 
 * @param type 格式化类型
 * @param model 模型名称
 * @param options 额外选项
 * @returns 请求格式化器实例
 */
export function createRequestFormatter(
    type: string,
    model: string,
    options?: any
): RequestFormatter {
    switch (type) {
        case RequestFormatType.OPENAI_COMPATIBLE:
            return new OpenAIRequestFormatter(model);

        case RequestFormatType.GEMINI:
            return new GeminiRequestFormatter(model);

        case RequestFormatType.CUSTOM:
            if (options?.formatFn && typeof options.formatFn === 'function') {
                return new CustomRequestFormatter(options.formatFn);
            }
            // 如果没有提供自定义函数，回退到OpenAI格式
            return new OpenAIRequestFormatter(model);

        default:
            // 默认使用OpenAI格式
            return new OpenAIRequestFormatter(model);
    }
}