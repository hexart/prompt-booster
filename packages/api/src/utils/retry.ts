/**
 * 重试工具
 * 处理网络请求重试逻辑
 */

/**
 * 通用重试函数
 * 支持可配置的重试策略
 * 
 * @param fn 要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param delay 初始延迟时间(毫秒)
 * @param multiplier 延迟时间增长系数
 * @returns 函数执行结果的Promise
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    multiplier: number = 1.5
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // 最后一次尝试，直接抛出错误
            if (attempt === maxRetries) {
                throw error;
            }

            // 永久性错误不重试
            if (isPermanentError(error)) {
                throw error;
            }

            // 计算下次重试延迟
            const retryDelay = delay * Math.pow(multiplier, attempt);
            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${retryDelay}ms`);
            await sleep(retryDelay);
        }
    }

    throw lastError;
}

/**
 * 判断是否为永久性错误
 * 永久性错误不会进行重试
 * 
 * @param error 错误对象
 * @returns 是否为永久性错误
 */
export function isPermanentError(error: any): boolean {
    // 认证错误
    if (error.response?.status === 401 || error.response?.status === 403) {
        return true;
    }

    // 资源不存在
    if (error.response?.status === 404) {
        return true;
    }

    // 请求格式错误
    if (error.response?.status === 400) {
        return true;
    }

    return false;
}

/**
 * 睡眠函数
 * 实现延迟执行
 * 
 * @param ms 毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}