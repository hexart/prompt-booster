// apps/web/src/hooks/useModelConnection.ts
import { useState } from 'react';
import { toast } from '~/components/ui';
import { testModelConnection, mergeWithDefaults } from '~/core/model/services/modelService';
import { useTranslation } from 'react-i18next';
import { handleOperationResult, handleUnexpectedError } from '~/utils/errorHandler';

/**
 * 模型连接测试钩子
 * 管理模型连接测试状态和函数
 */
export function useModelConnection() {
  const { t } = useTranslation();
  const [testingModels, setTestingModels] = useState<Record<string, boolean>>({});

  const testConnection = async (model: any) => {
    // 防止重复点击
    if (testingModels[model.id]) return;

    setTestingModels(prev => ({ ...prev, [model.id]: true }));

    let toastId: string | number | undefined;

    try {
      // 对于自定义接口，使用其 providerName 或 id
      const provider = model.isStandard ? model.id : (model.providerName || model.id);
      // 使用 CORE 包的 mergeWithDefaults
      const completeConfig = mergeWithDefaults(
        model.config,
        model.isStandard,
        model.id
      );
      const { apiKey, baseUrl, model: modelName } = completeConfig;

      toastId = toast.loading(t('toast.connection.testing', { modelName }));

      const finalBaseUrl = baseUrl || '';

      // 调用测试函数，传递自定义端点（如果存在）
      const result = await testModelConnection(
        provider,
        apiKey,
        finalBaseUrl,
        modelName,
        completeConfig.endpoint  // 直接传递 endpoint 字符串
      );

      handleOperationResult(
        result,
        t,
        t('toast.connection.success', { modelName }),
        toastId
      );
    } catch (error) {
      handleUnexpectedError(error, t, toastId);
    } finally {
      // 清除加载状态
      setTestingModels(prev => {
        const newState = { ...prev };
        delete newState[model.id];
        return newState;
      });
    }
  };

  return {
    testConnection,
    isTestingConnection: (id: string) => !!testingModels[id],
  };
}
