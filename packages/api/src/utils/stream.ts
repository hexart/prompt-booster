/**
 * 流处理工具
 * 处理流式响应数据
 */
import { StreamHandler } from '../types';

/**
 * 流格式枚举
 * 支持的流数据格式类型
 */
export enum StreamFormat {
    SSE = 'sse',
    JSON = 'json',
    TEXT = 'text',
    AUTO = 'auto'
}

/**
 * 创建流处理器
 * 根据回调函数创建标准流处理器
 * 
 * @param onData 数据处理回调
 * @param onError 错误处理回调(可选)
 * @param onComplete 完成处理回调(可选)
 * @returns 流处理器对象
 */
export function createStreamHandler(
    onData: (chunk: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
): StreamHandler {
    return {
        onData,
        onError,
        onComplete,
        abortController: new AbortController()
    };
}

/**
 * 解析流数据
 * 尝试从原始流数据中提取内容
 * 
 * @param chunk 原始流数据块
 * @param format 流格式
 * @returns 解析后的内容，如果无法解析则为null
 */
export function parseStreamData(chunk: any, format: StreamFormat = StreamFormat.AUTO): string | null {
    // 如果是字符串，根据格式解析
    if (typeof chunk === 'string') {
        // 解析SSE格式
        if (format === StreamFormat.SSE ||
            (format === StreamFormat.AUTO && chunk.startsWith('data:'))) {

            if (chunk === 'data: [DONE]') {
                return null;
            }

            if (chunk.startsWith('data:')) {
                const content = chunk.substring(5).trim();
                if (content === '[DONE]') {
                    return null;
                }

                try {
                    JSON.parse(content);
                    return content;
                } catch (e) {
                    // 不是JSON，直接返回文本
                    return content;
                }
            }
        }

        // 解析JSON格式
        if (format === StreamFormat.JSON ||
            (format === StreamFormat.AUTO && chunk.trim().startsWith('{'))) {
            try {
                JSON.parse(chunk);
                return chunk;
            } catch (e) {
                // 解析失败
                return null;
            }
        }

        // 纯文本格式
        if (format === StreamFormat.TEXT) {
            return chunk;
        }

        return chunk; // 默认返回原始字符串
    }

    // 非字符串类型，返回原始数据
    return JSON.stringify(chunk);
}

/**
 * 分割流数据
 * 将流数据缓冲区分割成多个数据块
 * 
 * @param buffer 数据缓冲区
 * @param format 流格式
 * @returns 分割后的数据块和剩余缓冲区
 */
export function splitStreamBuffer(
    buffer: string,
    format: StreamFormat = StreamFormat.AUTO
): { chunks: string[]; remaining: string } {
    // 确定格式
    let actualFormat = format;
    if (format === StreamFormat.AUTO) {
        if (buffer.includes('data:')) {
            actualFormat = StreamFormat.SSE;
        } else if (buffer.includes('{') && buffer.includes('}')) {
            actualFormat = StreamFormat.JSON;
        } else {
            actualFormat = StreamFormat.TEXT;
        }
    }

    // SSE格式按行分割
    if (actualFormat === StreamFormat.SSE) {
        const lines = buffer.split('\n');
        const remaining = lines.pop() || '';
        const chunks = lines.filter(line => line.trim().length > 0);
        return { chunks, remaining };
    }

    // JSON格式尝试分割多个JSON对象
    if (actualFormat === StreamFormat.JSON) {
        const chunks: string[] = [];
        let remaining = buffer;

        // 简化的JSON对象分割
        let startIdx = -1;
        let bracketCount = 0;

        for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];

            if (char === '{') {
                if (bracketCount === 0) {
                    startIdx = i;
                }
                bracketCount++;
            } else if (char === '}') {
                bracketCount--;
                if (bracketCount === 0 && startIdx !== -1) {
                    // 找到完整的JSON对象
                    chunks.push(buffer.substring(startIdx, i + 1));
                    startIdx = -1;
                }
            }
        }

        // 提取剩余部分
        if (chunks.length > 0) {
            const lastChunk = chunks[chunks.length - 1];
            const lastChunkEndIdx = buffer.lastIndexOf(lastChunk) + lastChunk.length;
            remaining = buffer.substring(lastChunkEndIdx);
        }

        return { chunks, remaining };
    }

    // 文本格式，按行分割
    const lines = buffer.split('\n');
    const remaining = lines.pop() || '';
    return { chunks: lines, remaining };
}