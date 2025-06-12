// apps/web/src/utils/displayUtils.ts
import { isRTL } from '../rtl';
import { PROVIDER_USER_EDIT } from '@prompt-booster/core/prompt/services/promptService';

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