//packages/api/src/index.ts
/**
 * 包入口文件
 * 导出所有公共API和类型
 */
// 导出客户端
export * from './client';

// 导出工厂函数
export * from './factory';

// 导出类型
export * from './types';

// 导出配置
export * from './config';

// 导出工具函数
export * from './utils';

// 导出策略
export * from './strategies';

/**
 * @deprecated 用于向后兼容的流处理器创建函数，未来版本将移除
 * 创建默认的流处理选项
 * @param setOutput 设置输出文本的函数
 * @param setIsStreaming 设置流状态的函数
 * @param abortControllerRef 中断控制器引用
 * @returns 流处理选项对象
 */
export function createDefaultStreamHandlers(
    setOutput: (value: React.SetStateAction<string>) => void,
    setIsStreaming: (value: React.SetStateAction<boolean>) => void,
    abortControllerRef?: React.MutableRefObject<AbortController | null>
): {
    enabled: boolean;
    onChunk: (chunk: string) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
    abortController?: AbortController;
} {
    // 创建一个新的 AbortController 实例
    const controller = new AbortController();

    // 如果有提供 ref，则更新它
    if (abortControllerRef) {
        abortControllerRef.current = controller;
    }

    return {
        enabled: true,
        onChunk: (chunk: string) => {
            setOutput(prevOutput => prevOutput + chunk);
        },
        onError: (error: Error) => {
            console.error('Stream error:', error);
            setIsStreaming(false);
            if (abortControllerRef) abortControllerRef.current = null;
        },
        onComplete: () => {
            setIsStreaming(false);
            if (abortControllerRef) abortControllerRef.current = null;
        },
        abortController: controller // 直接使用新创建的 controller
    };
}