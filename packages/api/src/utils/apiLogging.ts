// packages/api/src/utils/apiLogging.ts
/**
 * API 包日志控制工具
 */

// 日志状态
let loggingEnabled = false;

/**
 * 启用 API 调试日志
 * 
 * @description
 * 启用后，API 客户端将在控制台输出详细的调试信息，
 * 包括请求 URL、响应状态等，便于开发调试。
 * 
 * @example
 * import { enableLogging } from '@prompt-booster/api';
 * 
 * // 在开发环境启用日志
 * if (process.env.NODE_ENV === 'development') {
 *   enableLogging();
 * }
 */
export function enableLogging(): void {
  loggingEnabled = true;
}

/**
 * 禁用 API 调试日志
 * 
 * @description
 * 禁用后，API 客户端将不再输出调试信息。
 * 
 * @example
 * import { disableLogging } from '@prompt-booster/api';
 * 
 * disableLogging();
 */
export function disableLogging(): void {
  loggingEnabled = false;
}

/**
 * 检查日志是否启用
 * @returns 日志启用状态
 * @internal
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled;
}

/**
 * 输出调试日志
 * @param message 日志消息
 * @param data 附加数据
 * @internal
 */
export function logDebug(message: string, _data?: any): void {
  if (isLoggingEnabled()) {
    console.log(`[DEBUG] ${message}`);
  }
}