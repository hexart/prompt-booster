/**
 * 5. config/constants.ts - 常量定义
 */
// packages/core/src/config/constants.ts
/**
 * API端点常量
 */
export const API_BASEURL = {
    OPENAI: 'https://api.openai.com',
    GEMINI: 'https://generativelanguage.googleapis.com',
    DEEPSEEK: 'https://api.deepseek.com',
    HUNYUAN: 'https://api.hunyuan.cloud.tencent.com',
    SILICONFLOW: 'https://api.siliconflow.cn',
    OLLAMA: 'http://localhost:11434'
};

/**
 * 模型名称常量
 */
export const MODEL_NAMES = {
    OPENAI: {
        GPT4_TURBO: 'gpt-4-turbo',
        GPT4: 'gpt-4',
        GPT35_TURBO: 'gpt-3.5-turbo'
    },
    GEMINI: {
        PRO: 'gemini-1.5-pro',
        ULTRA: 'gemini-1.5-ultra',
    },
    DEEPSEEK: {
        CHAT: 'deepseek-chat',
        CODER: 'deepseek-coder'
    },
    HUNYUAN: {
        CHAT: 'hunyuan-turbos-latest'
    },
    SILICONFLOW: {
        CHAT: 'Qwen/QwQ-32B'
    },
    OLLAMA: {
        CHAT1: 'qwen2.5:14b',
        CHAT2: 'deepseek-r1:14b'
    }
};

/**
 * 本地存储键名常量
 */
export const STORAGE_KEYS = {
    PROMPT_STORE: 'prompt-store',
    MODEL_STORE: 'model-settings',
    TEMPLATES: 'templates',
    MEMORY_STORE: 'memory-store'
};

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
    NO_API_KEY: '未配置API密钥',
    INVALID_MODEL: '无效的模型配置',
    FETCH_FAILED: '请求失败，请检查网络连接',
    NOT_FOUND: '资源未找到',
    TEMPLATE_NOT_FOUND: '模板未找到',
    OPTIMIZATION_FAILED: '优化失败',
    EMPTY_PROMPT: '提示词为空',
};