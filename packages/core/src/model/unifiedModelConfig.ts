/**
 * 统一的模型配置管理
 * 集中管理所有模型相关的配置，消除重复
 */

// 模型提供商类型
export type ModelProvider = 'openai' | 'gemini' | 'deepseek' | 'hunyuan' | 'siliconflow' | 'ollama';

// 模型配置基础接口
export interface BaseModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  maxTokens: Record<string, number>;
  timeout?: number;
  endpoint?: string;
  isOpenAICompatible: boolean;
}

// 统一的模型配置
export const MODEL_REGISTRY: Record<ModelProvider, BaseModelConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    provider: 'openai',
    baseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4-turbo',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    maxTokens: {
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    },
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-1.5-pro',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    maxTokens: {
      'gemini-1.5-pro': 8192,
      'gemini-1.5-flash': 8192
    },
    timeout: 60000,
    endpoint: '/v1beta/models/{model}:generateContent',
    isOpenAICompatible: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
    maxTokens: {
      'deepseek-chat': 8192,
      'deepseek-coder': 16384
    },
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  hunyuan: {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    provider: 'hunyuan',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com',
    defaultModel: 'hunyuan-turbos-latest',
    models: ['hunyuan-turbos-latest'],
    maxTokens: {
      'hunyuan-turbos-latest': 16384
    },
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    provider: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn',
    defaultModel: 'Qwen/QwQ-32B',
    models: ['Qwen/QwQ-32B'],
    maxTokens: {
      'Qwen/QwQ-32B': 32768
    },
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'qwen3:32b',
    models: ['qwen3:32b', 'qwq:latest'],
    maxTokens: {
      'qwen3': 32768,
      'qwen3:32b': 32768,
      'qwq:latest': 32768
    },
    timeout: 180000,
    endpoint: '/api/chat',
    isOpenAICompatible: false
  }
};

// 获取模型的最大token数
export function getModelMaxTokens(provider: ModelProvider, model: string): number {
  const config = MODEL_REGISTRY[provider];
  if (!config) return 16384; // 默认值
  
  return config.maxTokens[model] || 16384;
}

// 检查是否为OpenAI兼容的提供商
export function isOpenAICompatible(provider: ModelProvider | string): boolean {
  const config = MODEL_REGISTRY[provider as ModelProvider];
  return config?.isOpenAICompatible ?? true;
}

// 获取默认配置
export function getDefaultModelConfig(provider: ModelProvider): BaseModelConfig | null {
  return MODEL_REGISTRY[provider] || null;
}

// 获取所有支持的提供商
export function getSupportedProviders(): ModelProvider[] {
  return Object.keys(MODEL_REGISTRY) as ModelProvider[];
}