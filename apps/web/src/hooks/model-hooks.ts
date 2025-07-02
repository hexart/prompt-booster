// apps/web/src/hooks/model-hooks.ts
import { useState, useMemo, useEffect } from 'react';
import { toast } from '@prompt-booster/ui';
import { useModelStore, type StandardModelType } from '@prompt-booster/core';
import { testModelConnection, maskApiKey, prepareModelsForDisplay } from '@prompt-booster/core/model/services/modelService';
import { ModelConfig, CustomInterface } from '@prompt-booster/core/model/models/config';
import { getDefaultModelConfig } from '@prompt-booster/core/model/unifiedModelConfig';
import { useTranslation } from 'react-i18next';
import { formatModelDisplayName } from '../utils/displayUtils';
import { isRTL } from '../rtl';

/**
 * 获取完整的模型配置（合并默认配置和用户配置）
 */
function getCompleteModelConfig(
  userConfig: ModelConfig | CustomInterface,
  isStandard: boolean,
  modelId: string
): ModelConfig | CustomInterface {
  if (!isStandard) {
    // 自定义接口直接返回用户配置
    return userConfig;
  }

  // 对于内置模型，获取默认配置
  const defaultConfig = getDefaultModelConfig(modelId as any);
  if (!defaultConfig) {
    return userConfig;
  }

  // 合并配置：用户配置优先，缺失的字段使用默认配置
  return {
    ...userConfig,
    providerName: userConfig.providerName || defaultConfig.providerName,
    baseUrl: userConfig.baseUrl || defaultConfig.baseUrl,
    endpoint: userConfig.endpoint || defaultConfig.endpoint,
    timeout: userConfig.timeout || defaultConfig.timeout,
    model: userConfig.model || defaultConfig.defaultModel,
  };
}

/**
 * 连接测试钩子
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
      const completeConfig = getCompleteModelConfig(
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
    getCompleteModelConfig
  };
}

/**
 * 模型编辑钩子
 * 管理模型编辑状态和函数
 */
export function useModelEdit() {
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

/**
 * 模型表单钩子
 * 管理模型编辑表单状态
 */
export function useModelForm(initialData: ModelConfig | CustomInterface) {
  const [formData, setFormData] = useState<ModelConfig | CustomInterface>(initialData);
  const [isMaskedApiKey, setIsMaskedApiKey] = useState(true);
  const [originalApiKey, setOriginalApiKey] = useState(initialData.apiKey || '');
  const [enableAfterSave, setEnableAfterSave] = useState(initialData.enabled || false);
  const [modelOptions, setModelOptions] = useState<Array<{ id: string, name: string }>>([]);

  const showApiKey = () => {
    setIsMaskedApiKey(false);
    setFormData(prev => ({
      ...prev,
      apiKey: originalApiKey
    }));
  };

  const hideApiKey = () => {
    setIsMaskedApiKey(true);
    setFormData(prev => ({
      ...prev,
      apiKey: maskApiKey(originalApiKey)
    }));
  };

  // ✅ 新增：初始化时合并默认配置
  const initializeFormData = (
    data: ModelConfig | CustomInterface,
    isStandard: boolean,
    modelId: string
  ) => {
    const completeConfig = getCompleteModelConfig(data, isStandard, modelId);
    setFormData(completeConfig);
    setOriginalApiKey(completeConfig.apiKey || '');

    // 创建掩码API Key
    const maskedApiKey = maskApiKey(completeConfig.apiKey || '');
    setFormData(prev => ({
      ...prev,
      apiKey: maskedApiKey
    }));

    setEnableAfterSave(completeConfig.enabled || false);
  };

  // 当初始数据变化时更新表单
  const updateFormWithInitialData = (
    data: ModelConfig | CustomInterface,
    isStandard: boolean = false,
    modelId: string = ''
  ) => {
    initializeFormData(data, isStandard, modelId);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    // 特殊处理 API Key 输入
    if (name === 'apiKey') {
      // 如果输入不包含星号，认为是新的API Key
      if (!value.includes('*')) {
        setOriginalApiKey(value);
        setIsMaskedApiKey(false);
      }
    }

    // 如果是自定义接口，且是供应商名称或模型名称变更，则自动更新接口名称
    if ('providerName' in formData && (name === 'providerName' || name === 'model')) {
      const customFormData = formData as CustomInterface;
      const providerName = name === 'providerName' ? value : customFormData.providerName || '';
      const modelName = name === 'model' ? value : formData.model || '';

      // 只有当两个字段都有值时才自动生成名称
      if (providerName && modelName) {
        setFormData(prev => ({
          ...prev,
          [name]: newValue,
          name: `${providerName} - ${modelName}`
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: newValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  return {
    formData,
    isMaskedApiKey,
    originalApiKey,
    enableAfterSave,
    modelOptions,
    setModelOptions,
    setIsMaskedApiKey,
    setEnableAfterSave,
    handleInputChange,
    updateFormWithInitialData,
    showApiKey,
    hideApiKey,
    getCompleteModelConfig
  };
}