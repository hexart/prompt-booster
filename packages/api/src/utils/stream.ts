// packages/api/src/utils/stream.ts
/**
 * 流数据处理工具模块
 * 
 * 本模块提供流式响应数据的解析和处理功能，主要用于处理 LLM API 的流式响应。
 * 
 * 主要功能：
 * 1. StreamFormat - 定义支持的流数据格式类型
 * 2. splitStreamBuffer - 智能分割流数据缓冲区，确保数据块的完整性
 * 
 * 支持的流格式：
 * - SSE (Server-Sent Events): 以 "data:" 开头的行式数据
 * - JSON: 完整的 JSON 对象流
 * - TEXT: 纯文本流，按行分割
 * - AUTO: 自动检测格式
 * 
 * @module utils/stream
 */

/**
 * 流格式枚举
 * 定义流式响应支持的数据格式类型
 */
export enum StreamFormat {
  /** 服务器发送事件格式 (Server-Sent Events) */
  SSE = 'sse',
  /** JSON 对象流格式 */
  JSON = 'json',
  /** 纯文本格式 */
  TEXT = 'text',
  /** 自动检测格式 */
  AUTO = 'auto'
}

/**
 * 分割流数据缓冲区
 * 
 * 将连续的流数据缓冲区智能分割成完整的数据块。
 * 该函数处理流式传输中的常见问题：数据可能在任意位置被截断。
 * 
 * @param buffer - 待处理的数据缓冲区
 * @param format - 数据格式，默认为自动检测
 * 
 * @returns 返回对象包含：
 *   - chunks: 完整的数据块数组
 *   - remaining: 未处理的剩余数据（不完整的部分）
 * 
 * @example
 * // SSE 格式示例
 * const { chunks, remaining } = splitStreamBuffer(
 *   'data: {"text": "Hello"}\ndata: {"text": "World"}\ndata: {"text": "Incomp',
 *   StreamFormat.SSE
 * );
 * // chunks: ['data: {"text": "Hello"}', 'data: {"text": "World"}']
 * // remaining: 'data: {"text": "Incomp'
 * 
 * @example
 * // JSON 格式示例
 * const { chunks, remaining } = splitStreamBuffer(
 *   '{"id":1,"msg":"Hi"}{"id":2,"msg":"Hello"}{"id":3,"msg":"Incomp',
 *   StreamFormat.JSON
 * );
 * // chunks: ['{"id":1,"msg":"Hi"}', '{"id":2,"msg":"Hello"}']
 * // remaining: '{"id":3,"msg":"Incomp'
 */
export function splitStreamBuffer(
  buffer: string,
  format: StreamFormat = StreamFormat.AUTO
): { chunks: string[]; remaining: string } {
  // 确定实际格式
  let actualFormat = format;
  if (format === StreamFormat.AUTO) {
    // 自动检测格式
    if (buffer.includes('data:')) {
      actualFormat = StreamFormat.SSE;
    } else if (buffer.includes('{') && buffer.includes('}')) {
      actualFormat = StreamFormat.JSON;
    } else {
      actualFormat = StreamFormat.TEXT;
    }
  }

  // SSE格式：按行分割，每行是一个完整的事件
  if (actualFormat === StreamFormat.SSE) {
    const lines = buffer.split('\n');
    const remaining = lines.pop() || '';  // 最后一行可能不完整
    const chunks = lines.filter(line => line.trim().length > 0);
    return { chunks, remaining };
  }

  // JSON格式：提取完整的JSON对象
  if (actualFormat === StreamFormat.JSON) {
    const chunks: string[] = [];
    let remaining = buffer;

    // 使用括号计数法提取完整的JSON对象
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
          // 找到一个完整的JSON对象
          chunks.push(buffer.substring(startIdx, i + 1));
          startIdx = -1;
        }
      }
    }

    // 计算剩余部分
    if (chunks.length > 0) {
      const lastChunk = chunks[chunks.length - 1];
      const lastChunkEndIdx = buffer.lastIndexOf(lastChunk) + lastChunk.length;
      remaining = buffer.substring(lastChunkEndIdx);
    }

    return { chunks, remaining };
  }

  // 文本格式：按行分割
  const lines = buffer.split('\n');
  const remaining = lines.pop() || '';  // 最后一行可能不完整
  return { chunks: lines, remaining };
}