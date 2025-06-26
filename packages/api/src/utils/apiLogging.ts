// packages/api/src/utils/apiLogging.ts
/**
 * API包日志控制工具
 */

// 日志状态
let loggingEnabled = true;

/**
 * 直接设置日志状态
 * 
 * @param enabled - 设置日志启用状态
 */
export function setApiLogging(enabled: boolean): void {
  loggingEnabled = enabled;
}


/**
 * 检查日志是否启用
 * 获取当前日志状态
 * 
 * @returns 查询日志启用状态
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled;
}

/**
 * 输出调试日志
 * @param message 日志消息
 */
export function logDebug(message: string, _data?: any): void {
  if (isLoggingEnabled()) {
    console.log(`[DEBUG] ${message}`);
  }
}