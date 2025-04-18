/**
 * 6. config/defaults.ts - 默认配置
 */
// packages/core/src/config/defaults.ts
import { ModelConfig, StandardModelType } from '../model';
import { API_BASEURL, MODEL_NAMES } from './constants';

/**
 * 默认模型配置
 */
export const defaultModelConfigs: Record<StandardModelType, ModelConfig> = {
    openai: {
        id: 'openai',
        providerName: 'OpenAI',
        apiKey: '',
        model: MODEL_NAMES.OPENAI.GPT4_TURBO,
        baseUrl: API_BASEURL.OPENAI,
        enabled: false
    },
    gemini: {
        id: 'gemini',
        providerName: 'Gemini',
        apiKey: '',
        model: MODEL_NAMES.GEMINI.PRO,
        baseUrl: API_BASEURL.GEMINI,
        enabled: false
    },
    deepseek: {
        id: 'deepseek',
        providerName: 'DeepSeek',
        apiKey: '',
        model: MODEL_NAMES.DEEPSEEK.CHAT,
        baseUrl: API_BASEURL.DEEPSEEK,
        enabled: false
    },
    hunyuan: {
        id: 'hunyuan',
        providerName: 'Hunyuan',
        apiKey: '',
        model: MODEL_NAMES.HUNYUAN.CHAT,
        baseUrl: API_BASEURL.HUNYUAN,
        enabled: false
    },
    siliconflow: {
        id: 'siliconflow',
        providerName: 'Siliconflow',
        apiKey: '',
        model: MODEL_NAMES.SILICONFLOW.CHAT,
        baseUrl: API_BASEURL.SILICONFLOW,
        enabled: false
    },
    ollama: {
        id: 'ollama',
        providerName: 'Ollama',
        apiKey: '',
        model: MODEL_NAMES.OLLAMA.CHAT1,
        baseUrl: API_BASEURL.OLLAMA,
        enabled: false
    },
};

/**
 * 默认优化设置
 */
export const defaultOptimizeSettings = {
    temperature: 0.7,
    maxTokens: 1000,
    stream: true,
    timeout: 60000
};
