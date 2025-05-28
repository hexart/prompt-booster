// apps/web/src/utils/displayUtils.ts
import { isRTL } from '../rtl';

/**
 * 格式化模型接口名称以适配RTL显示
 * 仅用于处理模型配置中存储的拼接字符串
 * @param name 原始名称（如："OpenAI - gpt-4"）
 * @returns RTL适配后的显示名称
 */
export const formatInterfaceName = (name: string, isRTLMode?: boolean): string => {
  const shouldFormat = isRTLMode ?? isRTL();
  // 检查是否是自动生成的格式（包含 " - "）
  const separator = ' - ';
  if (name.includes(separator)) {
    const parts = name.split(separator);
    if (parts.length === 2) {
      const [providerName, modelName] = parts;
      
      if (shouldFormat) {
        // RTL 模式：调整显示顺序
        return `${modelName} - ${providerName}`;
      }
    }
  }
  
  // LTR模式或非自动生成的名称直接返回
  return name;
};

/**
 * 动态拼接provider和model名称，支持RTL
 * 用于PromptHistory等需要动态拼接的场景
 * @param providerName 供应商名称
 * @param modelName 模型名称（可选）
 * @returns RTL适配后的拼接结果
 */
export const formatProviderModelName = (providerName: string, modelName?: string, isRTLMode?: boolean): string => {
  if (!modelName) return providerName;
  
  if (isRTLMode ?? isRTL()) {
    return `${modelName} - ${providerName}`;
  }
  
  return `${providerName} - ${modelName}`;
};