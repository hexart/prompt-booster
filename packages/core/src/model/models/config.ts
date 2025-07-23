// packages/core/src/model/models/config.ts
/**
 * 标准模型类型
 */
export type StandardModelType = 'openai' | 'claude' | 'gemini' | 'deepseek' | 'hunyuan' | 'siliconflow' | 'ollama';
export type ErrorType = 'connection' | 'auth' | 'validation' | 'response' | 'parse' | 'unknown';

/**
 * 模型配置接口
 */
export interface ModelConfig {
  /**
   * 唯一标识符（对于标准模型，应与StandardModelType值相同）
   */
  id: string;

  /**
   * 模型名称显示
   */
  name?: string;

  /**
   * 供应商名称显示
   */
  providerName: string;

  /**
   * API密钥
   */
  apiKey: string;

  /**
   * 基础URL（可选）
   */
  baseUrl?: string;

  /**
   * 模型名称
   */
  model: string;

  /**
   * 超时设置（单位：毫秒）
   */
  timeout?: number;

  /**
   * API端点路径（可选）
   */
  endpoint?: string;

  /**
   * 模型启用状态
   */
  enabled: boolean;
}

/**
 * 自定义接口配置
 */
export interface CustomInterface {
  /**
   * 唯一标识符
   */
  id: string;

  /**
   * 接口名称
   */
  name: string;

  /**
   * 供应商名称
   */
  providerName: string;

  /**
   * API密钥
   */
  apiKey: string;

  /**
   * 基础URL
   */
  baseUrl: string;

  /**
   * 模型名称
   */
  model: string;

  /**
   * 超时设置（单位：毫秒）
   */
  timeout?: number;

  /**
   * API端点路径（可选）
   */
  endpoint?: string;

  /**
   * 模型启用状态
   */
  enabled: boolean;
}

/**
 * 模型设置接口
 */
export interface ModelSettings {
  /**
   * 温度
   */
  temperature?: number;

  /**
   * 最大令牌数
   */
  maxTokens?: number;

  /**
   * 其他参数
   */
  [key: string]: any;
}