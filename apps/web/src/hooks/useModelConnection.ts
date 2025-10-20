// apps/web/src/hooks/useModelConnection.ts
import { useState } from 'react';
import { toast } from '~/components/ui';
import { testModelConnection, mergeWithDefaults } from '~/core/model/services/modelService';
import { useTranslation } from 'react-i18next';

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

    let toastId: string | number;

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

      if (result.success) {
        toast.success(t('toast.connection.success', { modelName }), {
          id: toastId
        });
      } else {
        let errorMessage: string;
        // 根据错误类型显示不同的本地化消息
        switch (result.errorType) {
          case 'validation':
            // 参数验证错误
            if (result.originalError?.includes('Provider')) {
              errorMessage = t('toast.validation.providerRequired');
            } else if (result.originalError?.includes('API Key')) {
              errorMessage = t('toast.validation.apiKeyRequired');
            } else if (result.originalError?.includes('Base URL')) {
              errorMessage = t('toast.validation.baseUrlRequired');
            } else if (result.originalError?.includes('Model name')) {
              errorMessage = t('toast.validation.modelNameRequired');
            } else {
              errorMessage = result.originalError || t('toast.connection.testFailed');
            }
            break;

          case 'auth':
            errorMessage = t('toast.connection.authFailed', {
              error: result.originalError || 'Authentication error'
            });
            break;

          case 'connection':
            errorMessage = t('toast.connection.failed', {
              error: result.originalError || 'Connection error'
            });
            break;

          case 'unknown':
          default:
            errorMessage = t('toast.connection.error', {
              error: result.originalError || 'Unknown error'
            });
            break;
        }

        // 更新为错误状态
        toast.error(errorMessage, {
          id: toastId
        });
      }
    } catch (error) {
      // 处理意外错误（理论上不应该到这里）
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 如果 toastId 存在，更新它；否则创建新的错误 toast
      if (toastId!) {
        toast.error(t('toast.connection.unexpectedError', { error: errorMessage }), {
          id: toastId
        });
      } else {
        toast.error(t('toast.connection.unexpectedError', { error: errorMessage }));
      }
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
