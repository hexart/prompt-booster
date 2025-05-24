// packages/api/src/utils/apiLogging.ts
/**
 * API包日志控制工具
 */

// 日志状态
let loggingEnabled = true;

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