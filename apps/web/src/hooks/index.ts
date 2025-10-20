// apps/web/src/hooks/index.ts

// 提示词相关钩子
export { usePromptManager } from './usePromptManager';
export type { UsePromptManagerResult } from './usePromptManager';
export { usePromptTemplates } from './usePromptTemplates';

// 模型相关钩子
export { useModelConnection } from './useModelConnection';
export { useModelEditor } from './useModelEditor';
export { useModelData } from './useModelData';
export { useModelForm } from './useModelForm';

// UI 工具钩子（从 ui/hooks 重新导出）
export { useAutoScroll } from '~/components/ui/hooks/useAutoscroll';
export { useModal } from '~/components/ui/hooks/useModal';
