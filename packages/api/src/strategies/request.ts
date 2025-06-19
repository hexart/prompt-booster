// packages/api/src/strategies/request.ts
/**
 * 请求格式化策略实现
 * 实现不同LLM服务的请求格式化
 */
import { RequestFormatter, ChatRequest } from '../types';
import { RequestFormatType, DEFAULT_TEMPERATURE } from '../config';

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

        // 构建完整请求
        return {
            model: this.model,
            messages,
            temperature: request.options?.temperature || DEFAULT_TEMPERATURE,
            // 只有明确设置maxTokens时才添加，否则让LLM自动决定
            ...(request.options?.maxTokens && {
                max_tokens: request.options.maxTokens
            })
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
     * 获取模型名称（用于URL构建等）
     */
    getModel(): string {
        return this.model;
    }

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

        // 构建完整请求
        return {
            contents,
            generationConfig: {
                temperature: request.options?.temperature || DEFAULT_TEMPERATURE,
                // 只有明确设置maxTokens时才添加
                ...(request.options?.maxTokens && {
                    maxOutputTokens: request.options.maxTokens
                })
            }
        };
    }
}

/**
 * Ollama请求格式化器
 * 适用于Ollama本地API
 */
export class OllamaRequestFormatter implements RequestFormatter {
    /**
     * @param model 模型名称
     * @param options 可选配置
     */
    constructor(
        private model: string,
        private options?: {
            endpoint?: string;
            useGenerateFormat?: boolean;
        }
    ) { }

    /**
     * 格式化请求为Ollama格式
     * @param request 标准聊天请求
     * @returns Ollama格式的请求体
     */
    formatRequest(request: ChatRequest): any {
        // 判断是否使用 chat 端点格式
        const useChatFormat = this.options?.endpoint === '/api/chat' || 
                            this.options?.endpoint?.includes('chat') ||
                            !this.options?.useGenerateFormat;

        if (useChatFormat) {
            // 使用 /api/chat 端点格式
            return this.formatChatRequest(request);
        } else {
            // 使用 /api/generate 端点格式
            return this.formatGenerateRequest(request);
        }
    }

    /**
     * 格式化为 /api/chat 请求格式
     * @param request 标准聊天请求
     * @returns Ollama chat 格式的请求体
     */
    private formatChatRequest(request: ChatRequest): any {
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
            messages.push(...request.history.map(msg => ({
                role: msg.role,
                content: msg.content
            })));
        }

        // 添加用户消息
        if (request.userMessage) {
            messages.push({
                role: 'user',
                content: request.userMessage
            });
        }

        // 如果消息数组为空，至少添加一个用户消息
        if (messages.length === 0) {
            messages.push({
                role: 'user',
                content: 'Hello'
            });
        }

        // Ollama chat API 格式
        return {
            model: this.model,
            messages: messages,
            stream: false,  // 非流式请求先设为 false
            options: {
                temperature: request.options?.temperature || DEFAULT_TEMPERATURE,
                ...(request.options?.maxTokens && {
                    num_predict: request.options.maxTokens
                })
            }
        };
    }

    /**
     * 格式化为 /api/generate 请求格式
     * @param request 标准聊天请求
     * @returns Ollama generate 格式的请求体
     */
    private formatGenerateRequest(request: ChatRequest): any {
        // 构建提示文本
        let prompt = '';

        // 如果有系统消息，先添加系统消息
        if (request.systemMessage) {
            prompt = request.systemMessage;
        }

        // 如果有历史对话，添加到提示中
        if (request.history && request.history.length > 0) {
            const historyText = request.history
                .map(msg => {
                    if (msg.role === 'user') {
                        return `User: ${msg.content}`;
                    } else if (msg.role === 'assistant') {
                        return `Assistant: ${msg.content}`;
                    }
                    return msg.content;
                })
                .join('\n');
            
            prompt = prompt ? `${prompt}\n\n${historyText}` : historyText;
        }

        // 添加当前用户消息
        if (request.userMessage) {
            prompt = prompt ? `${prompt}\n\nUser: ${request.userMessage}\nAssistant:` : request.userMessage;
        }

        // Ollama generate API 格式
        return {
            model: this.model,
            prompt: prompt,
            stream: false,  // 根据需要可以设置为 true
            options: {
                temperature: request.options?.temperature || DEFAULT_TEMPERATURE,
                ...(request.options?.maxTokens && {
                    num_predict: request.options.maxTokens
                })
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

        case RequestFormatType.OLLAMA:
            // 传递额外的选项给 Ollama 格式化器
            return new OllamaRequestFormatter(model, options);

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