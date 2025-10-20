// apps/web/src/hooks/useModelData.ts
import { useState, useMemo, useEffect } from 'react';
import { toast } from '~/components/ui';
import { useModelStore, type StandardModelType } from '~/core';
import { prepareModelsForDisplay } from '~/core/model/services/modelService';
import { useTranslation } from 'react-i18next';
import { formatModelDisplayName } from '../utils/displayUtils';
import { isRTL } from '../rtl';

/**
 * 模型数据钩子 - 统一的显示层接口
 * 获取和处理模型列表，包含所有显示相关逻辑
 */
export function useModelData() {
  const { t, i18n } = useTranslation();
  const [currentIsRTL, setCurrentIsRTL] = useState(isRTL());

  // 获取所有 store 状态和方法
  const {
    // === 基础状态 ===
    activeModel,
    // === 配置数据 ===
    configs,
    customInterfaces,
    // === 状态管理方法 ===
    setActiveModel,
    getActiveModelConfig,
    // === 标准模型操作 ===
    updateConfig,
    resetConfig,
    // === 自定义接口操作 ===
    addCustomInterface,
    updateCustomInterface,
    deleteCustomInterface,
    getCustomInterface,
    // === 工具方法 ===
    isCustomInterface,
  } = useModelStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIsRTL(isRTL());
    }, 10); // 确保HTML dir已更新

    return () => clearTimeout(timer);
  }, [i18n.language]);

  // 所有模型数据(合并标准模型和自定义接口，并进行RTL格式化)
  const allModels = useMemo(() => {
    const baseModels = prepareModelsForDisplay(configs, customInterfaces);
    return baseModels.map((model: any) => ({
      ...model,
      name: formatModelDisplayName(model.providerName, model.model, currentIsRTL)
    }));
  }, [configs, customInterfaces, i18n.language, currentIsRTL]);

  // 获取启用的模型列表（RTL格式化后的）
  const getEnabledModels = () => {
    return allModels.filter((model: any) => model.config.enabled);
  };

  // 处理启用/禁用模型
  const toggleModelStatus = (id: string, isStandard: boolean, enabled: boolean) => {
    // 如果是要启用内置模型，检查是否填写了 apiKey
    if (isStandard && enabled) {
      const modelConfig = configs[id as StandardModelType];

      // 检查 apiKey 是否填写
      if (!modelConfig.apiKey || modelConfig.apiKey.trim() === '') {
        toast.error(t('toast.enableModelFailed', { modelName: id, reason: t('toast.validation.apiKeyRequired') }));
        return;
      }

      // 检查 baseUrl 是否填写（对于需要 baseUrl 的模型）
      if (id === 'hunyuan' && (!modelConfig.baseUrl || modelConfig.baseUrl.trim() === '')) {
        toast.error(t('toast.enableModelFailed', { modelName: id, reason: t('toast.validation.baseUrlRequired') }));
        return;
      }
    }

    // 如果检查通过或是要禁用模型，则更新状态
    if (isStandard) {
      updateConfig(id as StandardModelType, { enabled });
    } else {
      updateCustomInterface(id, { enabled });
    }
  };

  // 处理删除自定义接口
  const deleteModel = (id: string) => {
    deleteCustomInterface(id);
    toast.success(t('toast.interfaceDeleteSuccess'));
  };

  return {
    // === 显示数据（经过RTL格式化） ===
    allModels,
    getEnabledModels,
    // === 基础状态 ===
    activeModel,
    // === 配置数据 ===
    configs,
    customInterfaces,
    // === 状态管理方法 ===
    setActiveModel,
    getActiveModelConfig,
    // === 标准模型操作 ===
    updateConfig,
    resetConfig,
    // === 自定义接口操作 ===
    addCustomInterface,
    updateCustomInterface,
    getCustomInterface,
    // === 工具方法 ===
    isCustomInterface,
    // === 业务操作方法（钩子特有） ===
    toggleModelStatus,
    deleteModel,
  };
}
