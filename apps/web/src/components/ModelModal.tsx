// apps/web/src/components/ModelModal.tsx
import React, { useEffect } from 'react';
import { type StandardModelType, type ModelConfig, type CustomInterface } from '@prompt-booster/core/model/models/config';
import {
  validateModelConfig,
  formatBaseUrl,
  formatEndpoint,
  getDefaultBaseUrl,
  fetchModelList,
  mergeWithDefaults,
  formatModelServiceError
} from '@prompt-booster/core/model/services/modelService';
import { Dialog, ModelSelector, toast, AnimatedButton } from '~/components/ui';
import { useModelForm } from '../hooks/model-hooks';
import { EyeIcon, EyeClosedIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatModelDisplayName } from '../utils/displayUtils';
import { getDefaultModelConfig } from '@prompt-booster/core/model/unifiedModelConfig';

// 模型编辑弹窗组件
interface ModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelType: string;
  initialData: ModelConfig | CustomInterface;
  onSave: (data: ModelConfig | CustomInterface, id: string | null) => Promise<void>;
  isCustom: boolean;
  isNewInterface: boolean;
  modelId: string | null;
}

export const ModelModal: React.FC<ModelModalProps> = ({
  isOpen,
  onClose,
  modelType,
  initialData,
  onSave,
  isCustom,
  isNewInterface,
  modelId
}) => {
  const { t } = useTranslation();
  const {
    formData,
    isMaskedApiKey,
    originalApiKey,
    enableAfterSave,
    // modelOptions,
    setModelOptions,
    setEnableAfterSave,
    handleInputChange,
    updateFormWithInitialData,
    showApiKey,
    hideApiKey,
  } = useModelForm(initialData);

  const [isSaving, setIsSaving] = React.useState(false);
  const defaultConfig = getDefaultModelConfig(modelType as StandardModelType);
  const providerName = defaultConfig?.providerName || modelType;

  // 判断是否应该显示 baseUrl 和 endpoint 字段
  // 自定义接口始终显示，内置模型只有 ollama 显示
  const shouldShowUrlFields = isCustom || modelType.toLowerCase() === 'ollama';

  // useEffect(() => {
  //   if (modelOptions.length > 0) {
  //     console.log('modelOptions updated:', modelOptions);
  //   }
  // }, [modelOptions]);

  // 当初始数据变化时更新表单
  useEffect(() => {
    updateFormWithInitialData(initialData, !isCustom, modelType);
  }, [initialData, isCustom, modelType]);

  /**
   * 处理表单提交：验证数据、格式化字段，然后调用父组件的保存方法
   */
  const handleSubmit = async () => {
    // 1. 使用 CORE 包的合并函数
    const completeFormData = mergeWithDefaults(formData, !isCustom, modelType);

    // 2. 验证表单（使用带翻译的验证）
    const validation = validateModelConfig(completeFormData, t);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    // 3. 判断是否自动启用
    const enabled = enableAfterSave && Boolean(completeFormData.apiKey && completeFormData.model && (!isCustom || (completeFormData as CustomInterface).providerName));

    // 格式化 baseUrl 和 endpoint
    const formattedData = {
      ...completeFormData,
      baseUrl: formatBaseUrl(completeFormData.baseUrl),
      endpoint: formatEndpoint(completeFormData.endpoint)
    };

    // 4. 准备保存数据
    const dataToSave = {
      ...formattedData,
      apiKey: isMaskedApiKey ? originalApiKey : completeFormData.apiKey,
      enabled
    };

    // 5. 调用 onSave 回调
    setIsSaving(true);
    try {
      await onSave(dataToSave, modelId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      clickOutside={false}
      maxWidth="max-w-md"
      title={isCustom ? (isNewInterface ? t('settings.newInterface') : t('settings.editInterface')) : t('settings.editModel', { type: providerName })}
      footer={
        <div className="flex justify-end gap-3">
          <AnimatedButton
            onClick={onClose}
            className="px-4 py-2 transition-colors button-cancel"
          >
            {t('common.buttons.cancel')}
          </AnimatedButton>
          <AnimatedButton
            onClick={handleSubmit}
            disabled={isSaving || !formData.apiKey}
            className="px-4 py-2 transition-colors button-confirm"
          >
            {isSaving ? t('common.buttons.saving') : t('common.buttons.save')}
          </AnimatedButton>
        </div>
      }
    >
      <div className="space-y-4">
        {isCustom && (
          <div>
            <label className="block text-sm font-medium mb-1 input-label" htmlFor='providerName'>{t('settings.providerName')}</label>
            <input
              type="text"
              id="providerName"
              name="providerName"
              value={(formData as CustomInterface).providerName || ''}
              onChange={handleInputChange}
              className="text-sm w-full p-2 border rounded input"
              placeholder={t('settings.providerNamePlaceholder')}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 input-label" htmlFor='apiKey'>API Key</label>
          <div className="relative">
            <input
              type={isMaskedApiKey ? "text" : "text"}
              id="apiKey"
              name="apiKey"
              value={formData.apiKey || ''}
              onChange={handleInputChange}
              className="text-sm w-full overflow-hidden truncate p-2 pe-10 border rounded input"
              placeholder={t('settings.apiKeyPlaceholder')}
            />
            {originalApiKey && (
              <AnimatedButton
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault(); // 防止默认行为
                  showApiKey();
                }}
                onPointerUp={() => hideApiKey()}
                onPointerLeave={() => hideApiKey()}
                onPointerCancel={() => hideApiKey()}
                className="absolute inset-y-0 end-0 px-3 flex items-center text-sm input-display-button"
                style={{ touchAction: 'none' }} // 防止触摸时的滚动等默认行为
                aria-label={isMaskedApiKey ? t('settings.apiKeyShow') : t('settings.apiKeyHide')}
              >
                {isMaskedApiKey ? <EyeClosedIcon size={18} /> : <EyeIcon size={18} />}
              </AnimatedButton>
            )}
          </div>
          <p className="mt-1 text-xs input-description">
            {isMaskedApiKey
              ? t('settings.apiKeyShow')
              : t('settings.apiKeyHide')}
          </p>
        </div>

        {shouldShowUrlFields && (
          <div>
            <label className="block text-sm font-medium mb-1 input-label" htmlFor='baseUrl'>
              {t('settings.apiBaseURL')}
              {isCustom && formData.baseUrl && (
                <span className="text-xs input-description">
                  {' → '}{formatBaseUrl(formData.baseUrl)}
                </span>
              )}
            </label>

            <input
              type="text"
              id="baseUrl"
              name="baseUrl"
              value={formData.baseUrl || ''}
              onChange={handleInputChange}
              className="text-sm w-full p-2 border rounded input"
              placeholder={isCustom
                ? t('settings.apiBaseURLPlaceholder')
                : getDefaultBaseUrl(modelType as StandardModelType)}
            />
            <p className="mt-1 text-xs input-description">
              {isCustom
                ? t('settings.apiCustomBaseURLDescription')
                : `${t('settings.apiBaseURLDefault')} ${getDefaultBaseUrl(modelType as StandardModelType) || t('settings.unknownModelInterface')}`
              }
            </p>
          </div>
        )}

        {shouldShowUrlFields && (
          <div>
            <label className="block text-sm font-medium mb-1 input-label" htmlFor='endpoint'>
              {t('settings.apiEndpointPath')}
              {isCustom && formData.endpoint && (
                <span className="text-xs input-description">
                  {' → '}{formatEndpoint(formData.endpoint)}
                </span>
              )}
            </label>
            <input
              type="text"
              id="endpoint"
              name="endpoint"
              value={formData.endpoint || ''}
              onChange={handleInputChange}
              className="text-sm w-full p-2 border rounded input"
              placeholder="/chat/completions"
            />
            <p className="mt-1 text-xs input-description">
              {isCustom
                ? t('settings.apiEndpointCustomHint')
                : t('settings.apiEndpointBuiltInHint')}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 input-label" htmlFor='model-selector'>{t('settings.modelList')}</label>
          <ModelSelector
            id='model-selector'
            value={formData.model || ''}
            onChange={(value) => {
              // 找到选中的模型选项
              handleInputChange({
                target: {
                  name: 'model',
                  value,
                  type: 'text'
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
            fetchModels={async () => {
              try {
                // 使用 CORE 包的 fetchModelList
                const models = await fetchModelList(
                  formData,
                  isCustom,
                  modelType,
                  originalApiKey
                );

                setModelOptions(models);
                return models;
              } catch (error: any) {
                // 使用 CORE 包的错误格式化
                const formattedError = formatModelServiceError(error);

                // 根据错误类型显示不同的提示
                if (formattedError.type === 'auth') {
                  toast.error(t('toast.invalidApiKey'));
                } else if (formattedError.type === 'validation') {
                  toast.error(formattedError.message);
                } else {
                  toast.error(t('toast.getModelListFailed'));
                }
                return [];
              }
            }}
            placeholder={t('settings.modelListPlaceholder')}
            className="text-sm w-full"
            disabled={!formData.apiKey || !formData.baseUrl}
          />
        </div>

        {isCustom && (
          <div>
            <label className="block text-sm font-medium mb-1 input-label" htmlFor='fullname'>{t('settings.interfaceName')}</label>
            <input
              type="text"
              id="fullname"
              name="name"
              value={formatModelDisplayName(formData.providerName, formData.model)}
              disabled={true}
              className="text-sm w-full p-2 border rounded input input-disabled"
              placeholder={t('settings.interfaceNamePlaceholder')}
              autoComplete="off"
            />
            <p className="mt-1 text-xs input-description">
              {t('settings.interfaceNameHint')}
            </p>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableAfterSave"
            checked={enableAfterSave}
            onChange={(e) => setEnableAfterSave(e.target.checked)}
            className="w-4 h-4 input"
          />
          <label htmlFor="enableAfterSave" className="ms-2 text-sm font-medium input-label">
            {t('settings.saveAndEnable')}
          </label>
        </div>
      </div>
    </Dialog>
  );
};

export default ModelModal;