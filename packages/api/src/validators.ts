// packages/api/src/validators.ts
/**
 * 配置验证工具
 * 提供运行时配置验证功能
 */

import { ClientConfig, ChatRequest } from './types';
import { LLMProvider } from './config';

/**
 * 验证客户端配置
 * 
 * @param config - 待验证的配置对象
 * @throws {Error} 当配置无效时抛出错误
 * 
 * @description
 * 在创建客户端前验证配置的有效性，提前发现配置错误。
 * 检查包括：
 * - 必需字段是否存在
 * - 字段类型是否正确
 * - 字段值是否合法
 * 
 * @example
 * try {
 *   validateClientConfig(config);
 *   const client = createClient(config);
 * } catch (error) {
 *   console.error('Invalid config:', error.message);
 * }
 */
export function validateClientConfig(config: any): asserts config is ClientConfig {
  // 检查配置对象是否存在
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  // 检查 provider
  if (!config.provider) {
    throw new Error('Provider is required');
  }
  if (typeof config.provider !== 'string') {
    throw new Error('Provider must be a string');
  }

  // 检查 apiKey（Ollama 不需要）
  if (config.provider.toLowerCase() !== LLMProvider.OLLAMA && !config.apiKey) {
    throw new Error(`API key is required for provider "${config.provider}"`);
  }
  if (config.apiKey && typeof config.apiKey !== 'string') {
    throw new Error('API key must be a string');
  }

  // 检查 baseUrl（可选）
  if (config.baseUrl !== undefined) {
    if (typeof config.baseUrl !== 'string') {
      throw new Error('Base URL must be a string');
    }
    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error('Base URL must be a valid URL');
    }
  }

  // 检查 model（可选）
  if (config.model !== undefined && typeof config.model !== 'string') {
    throw new Error('Model must be a string');
  }

  // 检查 timeout（可选）
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number') {
      throw new Error('Timeout must be a number');
    }
    if (config.timeout <= 0) {
      throw new Error('Timeout must be positive');
    }
  }

  // 检查 endpoints（可选）
  if (config.endpoints !== undefined) {
    if (typeof config.endpoints !== 'object') {
      throw new Error('Endpoints must be an object');
    }
    if (config.endpoints.chat !== undefined && typeof config.endpoints.chat !== 'string') {
      throw new Error('Chat endpoint must be a string');
    }
    if (config.endpoints.models !== undefined && typeof config.endpoints.models !== 'string') {
      throw new Error('Models endpoint must be a string');
    }
  }
}

/**
 * 验证聊天请求
 * 
 * @param request - 待验证的聊天请求
 * @returns 是否是有效的聊天请求
 * 
 * @description
 * 类型守卫函数，用于运行时检查聊天请求的有效性。
 * 
 * @example
 * if (isValidChatRequest(request)) {
 *   await client.chat(request);
 * } else {
 *   console.error('Invalid chat request');
 * }
 */
export function isValidChatRequest(request: any): request is ChatRequest {
  if (!request || typeof request !== 'object') {
    return false;
  }

  // userMessage 是必需的
  if (!request.userMessage || typeof request.userMessage !== 'string') {
    return false;
  }

  // systemMessage 是可选的
  if (request.systemMessage !== undefined && typeof request.systemMessage !== 'string') {
    return false;
  }

  // history 是可选的
  if (request.history !== undefined) {
    if (!Array.isArray(request.history)) {
      return false;
    }
    // 验证每条历史消息
    for (const msg of request.history) {
      if (!msg || typeof msg !== 'object') {
        return false;
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return false;
      }
      if (typeof msg.content !== 'string') {
        return false;
      }
    }
  }

  // options 是可选的
  if (request.options !== undefined) {
    if (typeof request.options !== 'object') {
      return false;
    }
    // 验证 temperature
    if (request.options.temperature !== undefined) {
      if (typeof request.options.temperature !== 'number') {
        return false;
      }
      if (request.options.temperature < 0 || request.options.temperature > 1) {
        return false;
      }
    }
    // 验证 maxTokens
    if (request.options.maxTokens !== undefined) {
      if (typeof request.options.maxTokens !== 'number') {
        return false;
      }
      if (request.options.maxTokens <= 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 验证聊天请求（断言版本）
 * 
 * @param request - 待验证的聊天请求
 * @throws {Error} 当请求无效时抛出错误
 * 
 * @description
 * 断言版本的请求验证，会抛出详细的错误信息。
 * 
 * @example
 * try {
 *   validateChatRequest(request);
 *   await client.chat(request);
 * } catch (error) {
 *   console.error('Invalid request:', error.message);
 * }
 */
export function validateChatRequest(request: any): asserts request is ChatRequest {
  if (!request || typeof request !== 'object') {
    throw new Error('Request must be an object');
  }

  if (!request.userMessage || typeof request.userMessage !== 'string') {
    throw new Error('User message is required and must be a string');
  }

  if (request.systemMessage !== undefined && typeof request.systemMessage !== 'string') {
    throw new Error('System message must be a string');
  }

  if (request.history !== undefined) {
    if (!Array.isArray(request.history)) {
      throw new Error('History must be an array');
    }
    for (let i = 0; i < request.history.length; i++) {
      const msg = request.history[i];
      if (!msg || typeof msg !== 'object') {
        throw new Error(`History[${i}] must be an object`);
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        throw new Error(`History[${i}].role must be 'system', 'user', or 'assistant'`);
      }
      if (typeof msg.content !== 'string') {
        throw new Error(`History[${i}].content must be a string`);
      }
    }
  }

  if (request.options !== undefined) {
    if (typeof request.options !== 'object') {
      throw new Error('Options must be an object');
    }
    if (request.options.temperature !== undefined) {
      if (typeof request.options.temperature !== 'number') {
        throw new Error('Temperature must be a number');
      }
      if (request.options.temperature < 0 || request.options.temperature > 1) {
        throw new Error('Temperature must be between 0 and 1');
      }
    }
    if (request.options.maxTokens !== undefined) {
      if (typeof request.options.maxTokens !== 'number') {
        throw new Error('Max tokens must be a number');
      }
      if (request.options.maxTokens <= 0) {
        throw new Error('Max tokens must be positive');
      }
    }
  }
}
