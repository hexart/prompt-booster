// packages/api/src/utils/cors.ts
// 新建 CORS 工具文件
import { ClientConfig } from '../types';
import { CORS_CONFIG } from '../config/constants';

/**
 * 检查 URL 是否需要 CORS 代理
 */
export function needsCorsProxy(url: string): boolean {
  // 如果是相对路径，不需要代理
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // 检查是否匹配需要 CORS 的模式
  return CORS_CONFIG.CORS_REQUIRED_PATTERNS.some(pattern =>
    pattern.test(url)
  );
}

/**
 * 构建带 CORS 代理的 URL
 */
export function buildProxyUrl(originalUrl: string, proxyUrl?: string): string {
  if (!proxyUrl) {
    // 使用默认代理
    proxyUrl = CORS_CONFIG.DEFAULT_PROXIES[0];
  }

  // 确保原始 URL 被正确编码
  const encodedUrl = encodeURIComponent(originalUrl);

  // 不同代理服务的 URL 格式可能不同
  if (proxyUrl.includes('?url=')) {
    return proxyUrl + encodedUrl;
  } else {
    return proxyUrl + '/' + originalUrl;
  }
}

/**
 * 构建 CORS 安全的请求配置
 */
export function buildCorsHeaders(
  headers: Record<string, string>,
  corsConfig?: ClientConfig['cors']
): Record<string, string> {
  const corsHeaders = { ...headers };

  // 无论是否启用 CORS 代理，都应用自定义 headers
  if (corsConfig?.headers) {
    Object.assign(corsHeaders, corsConfig.headers);
  }

  // 只有启用 CORS 代理时才添加代理特定的头
  if (corsConfig?.enabled) {
    // 某些 CORS 代理需要特定的头
    corsHeaders['X-Requested-With'] = 'XMLHttpRequest';
  }

  return corsHeaders;
}