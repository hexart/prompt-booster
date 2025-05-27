// apps/web/src/rtl.ts

// RTL 语言列表
export const RTL_LANGUAGES = [
  'ar-SA', // 阿拉伯语
  'he-IL', // 希伯来语
  'fa-IR', // 波斯语
  'ur-PK', // 乌尔都语
  'ar',    // 通用阿拉伯语
  'he',    // 通用希伯来语
  'fa',    // 通用波斯语
  'ur'     // 通用乌尔都语
] as const;

// Tooltip 位置类型
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * 检查语言是否为 RTL
 */
export const isRTLLanguage = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language as any);
};

/**
 * 获取当前文档方向
 */
export const getDocumentDirection = (): 'ltr' | 'rtl' => {
  return document.documentElement.dir as 'ltr' | 'rtl' || 'ltr';
};

/**
 * 检查当前是否为RTL方向
 */
export const isRTL = (): boolean => {
  return getDocumentDirection() === 'rtl';
};

/**
 * 设置文档方向
 */
export const setDocumentDirection = (direction: 'ltr' | 'rtl'): void => {
  document.documentElement.dir = direction;

  // 同时为 body 添加对应的类名
  document.body.classList.toggle('rtl', direction === 'rtl');
  document.body.classList.toggle('ltr', direction === 'ltr');
};

/**
 * 根据语言自动设置文档方向
 */
export const setDirectionByLanguage = (language: string): void => {
  const direction = isRTLLanguage(language) ? 'rtl' : 'ltr';
  setDocumentDirection(direction);
};

/**
 * RTL 样式类名辅助函数
 * 用于动态生成支持 RTL 的 className
 */
export const rtlClass = (ltrClass: string, rtlClass?: string): string => {
  const currentDir = getDocumentDirection();
  if (currentDir === 'rtl' && rtlClass) {
    return rtlClass;
  }
  return ltrClass;
};

/**
 * 组合 LTR 和 RTL 样式类
 */
export const combineDirectionClasses = (
  baseClass: string,
  ltrClass: string,
  rtlClass: string
): string => {
  return `${baseClass} ${ltrClass} rtl:${rtlClass}`;
};

// ===== Tooltip 位置辅助函数 =====

/**
 * 根据当前方向获取Tooltip位置
 * 
 * @param basePosition - 基准位置（通常为LTR模式下的位置）
 * @param rtlOverride - RTL模式下的位置覆盖，如果不提供则会自动镜像
 * 
 * @example
 * // 自动镜像：LTR时显示在left，RTL时显示在right
 * getTooltipPosition('left')
 * 
 * @example  
 * // 手动指定：LTR时显示在left，RTL时显示在top
 * getTooltipPosition('left', 'top')
 * 
 * @example
 * // top/bottom在任何方向下都保持不变
 * getTooltipPosition('top') // 始终是 top
 */
export const getTooltipPosition = (
  basePosition: TooltipPosition,
  rtlOverride?: TooltipPosition
): TooltipPosition => {
  if (!isRTL()) {
    return basePosition;
  }

  // 如果提供了 RTL 位置覆盖，直接使用
  if (rtlOverride) {
    return rtlOverride;
  }

  // 自动镜像：left <-> right，top/bottom 保持不变
  switch (basePosition) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'top':
    case 'bottom':
    default:
      return basePosition;
  }
};