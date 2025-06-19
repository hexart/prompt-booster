// apps/web/src/components/ModelModal.tsx
import React, { useEffect } from 'react';
import { type StandardModelType, type ModelConfig, type CustomInterface } from '@prompt-booster/core/model/models/config';
import { createClient } from '@prompt-booster/api/factory';
import { validateModelConfig, getDefaultBaseUrl } from '@prompt-booster/core/model/services/modelService';
import { Dialog, ModelSelector, toast } from '@prompt-booster/ui';
import { useModelForm } from '../hooks/model-hooks';
import { EyeIcon, EyeClosedIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatInterfaceName } from '../utils/displayUtils';

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
    modelOptions,
    setModelOptions,
    setEnableAfterSave,
    handleInputChange,
    updateFormWithInitialData,
    showApiKey,
    hideApiKey,
    getCompleteModelConfig
  } = useModelForm(initialData);

  const [isSaving, setIsSaving] = React.useState(false);

  useEffect(() => {
    if (modelOptions.length > 0) {
      console.log('modelOptions updated:', modelOptions);
    }
  }, [modelOptions]);

  // 当初始数据变化时更新表单
  useEffect(() => {
    updateFormWithInitialData(initialData, !isCustom, modelType);
  }, [initialData, isCustom, modelType]);

  const handleSave = async () => {
    // 合并默认配置
    const completeFormData = getCompleteModelConfig(formData, !isCustom, modelType);
    // 验证表单
    const validation = validateModelConfig(completeFormData);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    // 如果所有必要字段都有值，自动设为启用状态
    const enabled = enableAfterSave && Boolean(completeFormData.apiKey && completeFormData.model && (!isCustom || (completeFormData as CustomInterface).providerName));

    // 准备保存数据
    const dataToSave = {
      ...completeFormData,
      apiKey: isMaskedApiKey ? originalApiKey : completeFormData.apiKey,
      enabled
    };

    setIsSaving(true);
    try {
      await onSave(dataToSave, modelId);
      onClose();
    } catch (error) {
      console.error('保存模型配置失败:', error);
      toast.error(t('toast.savingFailed'));
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
      title={isCustom ? (isNewInterface ? t('settings.newInterface') : t('settings.editInterface')) : t('settings.editModel', { type: modelType })}
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 transition-colors button-cancel"
          >
            {t('common.buttons.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.apiKey}
            className="px-4 py-2 transition-colors button-confirm"
          >
            {isSaving ? t('common.buttons.saving') : t('common.buttons.save')}
          </button>
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
              className="w-full p-2 border rounded input"
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
              className="w-full overflow-hidden truncate p-2 pe-10 border rounded input"
              placeholder={t('settings.apiKeyPlaceholder')}
            />
            {originalApiKey && (
              <button
                type="button"
                onMouseDown={() => showApiKey()}
                onMouseUp={() => hideApiKey()}
                onMouseLeave={() => hideApiKey()}
                className="absolute inset-y-0 end-0 px-3 flex items-center text-sm input-display-button"
              >
                {isMaskedApiKey ? <EyeClosedIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs input-description">
            {isMaskedApiKey
              ? t('settings.apiKeyShow')
              : t('settings.apiKeyHide')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 input-label" htmlFor='baseUrl'>{t('settings.apiBaseURL')}</label>
          <input
            type="text"
            id="baseUrl"
            name="baseUrl"
            value={formData.baseUrl || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded input"
            placeholder={isCustom
              ? t('settings.apiBaseURLPlaceholder')
              : getDefaultBaseUrl(modelType as StandardModelType)}
          />
          {!isCustom && (
            <p className="mt-1 text-xs input-description">
              {t('settings.apiBaseURLDefault')} {getDefaultBaseUrl(modelType as StandardModelType) || "未设置"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 input-label" htmlFor='endpoint'>{t('settings.apiEndpointPath')}</label>
          <input
            type="text"
            id="endpoint"
            name="endpoint"
            value={formData.endpoint || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded input"
            placeholder="/v1/chat/completions"
          />
          <p className="mt-1 text-xs input-description">
            {isCustom
              ? t('settings.apiEndpointCustomHint')
              : t('settings.apiEndpointBuiltInHint')}
          </p>
        </div>

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
                // ✅ 使用合并后的完整配置
                const completeConfig = getCompleteModelConfig(formData, !isCustom, modelType);

                // 只有当有 apiKey 和 baseUrl 时才尝试获取模型列表
                if (!completeConfig.apiKey || !completeConfig.baseUrl) {
                  toast.error(t('toast.fillAPIKey_BaseURL'));
                  return [];
                }

                const provider = isCustom ?
                  (completeConfig as CustomInterface).providerName || 'custom' :
                  modelType;

                const client = createClient({
                  provider,
                  apiKey: originalApiKey,
                  baseUrl: completeConfig.baseUrl,
                  model: 'default',
                  endpoints: {
                    chat: completeConfig.endpoint || '/v1/chat/completions',
                    models: '/v1/models'
                  }
                });

                // 获取模型列表
                const models = await client.getModels();
                const options = models.map(model => ({
                  id: model.id,
                  name: model.name || model.id
                }));
                setModelOptions(options);
                return options;
              } catch (error) {
                console.error('获取模型列表失败:', error);
                toast.error(t('toast.getModelListFailed'));
                return [];
              }
            }}
            placeholder={t('settings.modelListPlaceholder')}
            className="w-full"
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
              value={formatInterfaceName(formData.name || '')}
              disabled={true}
              className="w-full p-2 border rounded input input-disabled"
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