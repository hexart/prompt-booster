/**
 * 响应解析策略实现
 * 实现不同LLM服务的响应解析
 */
import { ResponseParser, ChatResponse } from '../types';
import { ResponseParseType } from '../config';

/**
 * OpenAI兼容响应解析器
 * 适用于OpenAI及兼容其格式的API
 */
export class OpenAIResponseParser implements ResponseParser {
    /**
     * 解析OpenAI流式响应块
     * @param chunk 响应数据块
     * @returns 解析出的文本内容
     */
    parseStreamChunk(chunk: any): string | null {
        // 从OpenAI流格式中提取内容
        if (chunk && chunk.choices && chunk.choices.length > 0) {
            const delta = chunk.choices[0].delta;
            if (delta && delta.content) {
                return delta.content;
            }
        }

        // 如果数据是字符串，直接返回
        if (typeof chunk === 'string') {
            return chunk;
        }

        return null;
    }

    /**
     * 解析OpenAI完整响应
     * @param response 完整响应数据
     * @returns 标准化的聊天响应
     */
    parseFullResponse(response: any): ChatResponse {
        if (response && response.choices && response.choices.length > 0) {
            const choice = response.choices[0];

            return {
                content: choice.message?.content || '',
                usage: response.usage || {},
                model: response.model,
                meta: {
                    finishReason: choice.finish_reason,
                    id: response.id
                }
            };
        }

        // 如果找不到标准格式，尝试直接提取内容
        if (typeof response === 'string') {
            return { content: response };
        }

        // 最后回退到空响应
        return { content: '' };
    }
}

/**
 * Gemini响应解析器
 * 适用于Google的Gemini API
 */
export class GeminiResponseParser implements ResponseParser {
    /**
     * 解析Gemini流式响应块
     * @param chunk 响应数据块
     * @returns 解析出的文本内容
     */
    parseStreamChunk(chunk: any): string | null {
        if (chunk &&
            chunk.candidates &&
            chunk.candidates.length > 0 &&
            chunk.candidates[0].content &&
            chunk.candidates[0].content.parts &&
            chunk.candidates[0].content.parts.length > 0) {
            return chunk.candidates[0].content.parts[0].text || null;
        }

        // 如果数据是字符串，直接返回
        if (typeof chunk === 'string') {
            return chunk;
        }

        return null;
    }

    /**
     * 解析Gemini完整响应
     * @param response 完整响应数据
     * @returns 标准化的聊天响应
     */
    parseFullResponse(response: any): ChatResponse {
        if (response &&
            response.candidates &&
            response.candidates.length > 0 &&
            response.candidates[0].content &&
            response.candidates[0].content.parts &&
            response.candidates[0].content.parts.length > 0) {

            const text = response.candidates[0].content.parts[0].text || '';

            return {
                content: text,
                usage: {
                    promptTokens: response.usageMetadata?.promptTokenCount,
                    completionTokens: response.usageMetadata?.candidatesTokenCount,
                    totalTokens: (response.usageMetadata?.promptTokenCount || 0) +
                        (response.usageMetadata?.candidatesTokenCount || 0)
                },
                model: response.modelId,
                meta: {
                    finishReason: response.candidates[0].finishReason,
                    safetyRatings: response.candidates[0].safetyRatings
                }
            };
        }

        // 最后回退到空响应
        return { content: '' };
    }
}

/**
 * 自定义响应解析器
 * 支持自定义解析逻辑
 */
export class CustomResponseParser implements ResponseParser {
    /**
     * @param parseStreamFn 自定义流解析函数
     * @param parseFullFn 自定义完整响应解析函数
     */
    constructor(
        private parseStreamFn: (chunk: any) => string | null,
        private parseFullFn?: (response: any) => ChatResponse
    ) { }

    /**
     * 使用自定义逻辑解析流块
     * @param chunk 响应数据块
     * @returns 解析出的文本内容
     */
    parseStreamChunk(chunk: any): string | null {
        return this.parseStreamFn(chunk);
    }

    /**
     * 使用自定义逻辑解析完整响应
     * @param response 完整响应数据
     * @returns 标准化的聊天响应
     */
    parseFullResponse(response: any): ChatResponse {
        if (this.parseFullFn) {
            return this.parseFullFn(response);
        }

        // 默认返回空响应
        return { content: '' };
    }
}

/**
 * 创建响应解析器
 * 工厂函数，根据类型创建合适的解析器
 * 
 * @param type 解析类型
 * @param options 额外选项
 * @returns 响应解析器实例
 */
export function createResponseParser(
    type: string,
    options?: any
): ResponseParser {
    switch (type) {
        case ResponseParseType.OPENAI_COMPATIBLE:
            return new OpenAIResponseParser();

        case ResponseParseType.GEMINI:
            return new GeminiResponseParser();

        case ResponseParseType.CUSTOM:
            if (options?.parseStreamFn && typeof options.parseStreamFn === 'function') {
                return new CustomResponseParser(
                    options.parseStreamFn,
                    options.parseFullFn
                );
            }
            // 如果没有提供自定义函数，回退到OpenAI格式
            return new OpenAIResponseParser();

        default:
            // 默认使用OpenAI格式
            return new OpenAIResponseParser();
    }
}