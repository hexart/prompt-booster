// apps/web/src/hooks/useModelForm.ts
import { useState } from 'react';
import { maskApiKey, mergeWithDefaults } from '~/core/model/services/modelService';
import { ModelConfig, CustomInterface } from '~/core/model/models/config';

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

  const initializeFormData = (
    data: ModelConfig | CustomInterface,
    isStandard: boolean,
    modelId: string
  ) => {
    const completeConfig = mergeWithDefaults(data, isStandard, modelId);
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
    hideApiKey
  };
}
