// apps/web/src/hooks/useModelEditor.ts
import { toast } from '~/components/ui';
import { useModelStore, type StandardModelType } from '~/core';
import { ModelConfig, CustomInterface } from '~/core/model/models/config';
import { useTranslation } from 'react-i18next';

/**
 * 模型编辑钩子
 * 管理模型配置的保存操作
 */
export function useModelEditor() {
  const { t } = useTranslation();
  const { updateConfig, addCustomInterface, updateCustomInterface } = useModelStore();

  // 保存模型配置
  const saveModel = async (
    data: ModelConfig | CustomInterface,
    modelId: string | null,
    isAddingCustom: boolean,
    isNewInterface: boolean
  ): Promise<string | void> => {
    try {
      // 编辑现有接口的情况（无论是内置还是自定义）
      if (modelId) {
        if (isAddingCustom) {
          // 编辑自定义接口
          updateCustomInterface(modelId, data as CustomInterface);
        } else {
          // 更新标准模型
          updateConfig(modelId as StandardModelType, data as ModelConfig);
        }
        toast.success(t('toast.interfaceUpdateSuccess'));
        return;
      }

      // 只有modelId为null时才进入新建逻辑
      if (isAddingCustom && isNewInterface) {
        const customData = data as CustomInterface;

        // 新增自定义接口
        const newId = addCustomInterface({
          name: customData.name,
          providerName: customData.providerName,
          apiKey: customData.apiKey,
          baseUrl: customData.baseUrl,
          model: customData.model,
          endpoint: customData.endpoint || '/chat/completions',
          enabled: customData.enabled || false
        });

        toast.success(t('toast.newInterfaceCreated'));
        return newId;
      }
    } catch (error) {
      console.error('保存模型配置失败:', error);
      toast.error(t('toast.saveFailed', { errorMessage: error instanceof Error ? error.message : String(error) }));
      throw error;
    }
  };

  return {
    saveModel
  };
}
