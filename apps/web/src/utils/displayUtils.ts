// apps/web/src/utils/displayUtils.ts
import { isRTL } from '../rtl';
import { PROVIDER_USER_EDIT } from '~/core/prompt/services/promptService';

/**
 * 格式化模型接口显示名称，支持RTL适配
 * @param providerName 提供商名称
 * @param modelName 模型名称
 * @param isRTLMode 是否为RTL模式（可选，默认自动检测）
 * @returns 格式化后的显示名称
 */
export const formatModelDisplayName = (
  providerName: string, 
  modelName: string, 
  isRTLMode?: boolean
): string => {
  const shouldFormat = isRTLMode ?? isRTL();
  
  if (shouldFormat) {
    // RTL 模式：模型名 - 提供商名
    return `${modelName} - ${providerName}`;
  } else {
    // LTR 模式：提供商名 - 模型名
    return `${providerName} - ${modelName}`;
  }
};

/**
 * 生成版本工具提示文本，处理用户编辑和AI模型两种情况
 * 用于 PromptHistory 和 PromptBooster 中的版本标签 Tooltip
 * @param version 版本信息，包含 provider 和可选的 modelName
 * @param t 国际化翻译函数
 * @param isRTLMode 是否为RTL模式（可选，默认自动检测）
 * @returns 格式化的工具提示文本
 */
export const getVersionTooltipText = (
  version: { provider: string; modelName?: string },
  t: (key: string) => string,
  isRTLMode?: boolean
): string => {
  if (version.provider === PROVIDER_USER_EDIT) {
    return t('history.userEdit');
  }

  let modelDisplayText = version.provider;
  if (version.modelName) {
    if (isRTLMode ?? isRTL()) {
      modelDisplayText = `${version.modelName} - ${version.provider}`;
    } else {
      modelDisplayText = `${version.provider} - ${version.modelName}`;
    }
  }

  return `${t('history.usingModel')}\n${modelDisplayText}`;
};