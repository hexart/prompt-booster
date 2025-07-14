// packages/api/src/strategies/auth.ts
/**
 * 认证策略实现
 * 实现不同类型的API认证方法
 */
import { InternalAxiosRequestConfig } from 'axios';
import { AuthStrategy } from '../types';
import { AuthType } from '../config';

/**
 * Bearer令牌认证策略
 * 使用Bearer令牌进行认证
 */
export class BearerAuthStrategy implements AuthStrategy {
  /**
   * @param apiKey API密钥或令牌
   */
  constructor(private apiKey: string) { }

  /**
   * 应用Bearer认证
   * @param config Axios请求配置
   * @returns 更新后的请求配置
   */
  applyAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${this.apiKey}`;
    return config;
  }
}

/**
 * 查询参数认证策略
 * 使用URL查询参数进行认证
 */
export class QueryParamAuthStrategy implements AuthStrategy {
  /**
   * @param apiKey API密钥
   * @param paramName 参数名称
   */
  constructor(private apiKey: string, private paramName: string = 'key') { }

  /**
   * 应用查询参数认证
   * @param config Axios请求配置
   * @returns 更新后的请求配置
   */
  applyAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    config.params = config.params || {};
    config.params[this.paramName] = this.apiKey;
    return config;
  }
}

/**
 * 自定义认证策略
 * 支持自定义认证方式
 */
export class CustomAuthStrategy implements AuthStrategy {
  /**
   * @param applyAuthFn 自定义认证函数
   */
  constructor(private applyAuthFn: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) { }

  /**
   * 应用自定义认证
   * @param config Axios请求配置
   * @returns 更新后的请求配置
   */
  applyAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    return this.applyAuthFn(config);
  }
}

/**
 * 创建认证策略
 * 工厂函数，根据类型创建合适的认证策略
 * 
 * @param type 认证类型
 * @param apiKey API密钥
 * @param options 额外选项
 * @returns 认证策略实例
 */
export function createAuthStrategy(
  type: string,
  apiKey: string,
  options?: any
): AuthStrategy {
  switch (type) {
    case AuthType.BEARER:
      return new BearerAuthStrategy(apiKey);

    case AuthType.QUERY_PARAM:
      return new QueryParamAuthStrategy(apiKey, options?.paramName);

    case AuthType.CUSTOM:
      // 如果提供了 headerName，创建一个设置自定义头的策略
      if (options?.headerName) {
        return new CustomAuthStrategy(config => {
          config.headers = config.headers || {};
          config.headers[options.headerName] = options.headerValue || apiKey;
          return config;
        });
      }
      // 如果提供了自定义函数
      if (options?.applyAuthFn && typeof options.applyAuthFn === 'function') {
        return new CustomAuthStrategy(options.applyAuthFn);
      }
      // 默认：不修改配置
      return new CustomAuthStrategy(config => config);

    default:
      // 默认使用Bearer认证
      return new BearerAuthStrategy(apiKey);
  }
}