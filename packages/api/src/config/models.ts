/**
 * 模型配置文件
 * 定义模型的令牌限制和其他特性
 */

/**
 * 模型最大令牌限制
 * 各个模型支持的最大令牌数量
 */
export const MODEL_MAX_TOKENS: Record<string, number> = {
    // OpenAI 模型
    'gpt-4': 8192,
    'gpt-4-turbo': 128000,
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-16k': 16384,

    // Google 模型
    'gemini-pro': 8192,
    'gemini-ultra': 32768,

    // DeepSeek 模型
    'deepseek-chat': 8192,
    'deepseek-coder': 16384,

    // Ollama 模型 
    'qwq': 32768,
    'qwen3': 32768,
    'qwen3:32b': 32768,
    'qwq:latest': 32768,

    // 默认值
    'default': 16384
};

/**
 * 获取模型最大令牌数
 * @param model 模型名称
 * @param defaultValue 默认值
 * @returns 最大令牌数量
 */
export function getMaxTokensForModel(model?: string, defaultValue?: number): number {
    if (!model) return defaultValue || MODEL_MAX_TOKENS.default;

    // 直接匹配
    if (model in MODEL_MAX_TOKENS) {
        return MODEL_MAX_TOKENS[model];
    }

    // 前缀匹配
    const modelPrefix = Object.keys(MODEL_MAX_TOKENS).find(key =>
        model.startsWith(key) && key !== 'default'
    );

    if (modelPrefix) {
        return MODEL_MAX_TOKENS[modelPrefix];
    }

    // 使用默认值
    return defaultValue || MODEL_MAX_TOKENS.default;
}