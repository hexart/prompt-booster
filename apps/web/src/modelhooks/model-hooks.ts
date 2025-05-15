// apps/web/src/hooks/model-hooks.ts
import { useState, useMemo } from 'react';
import { toast } from '@prompt-booster/ui';
import { useModelStore, type StandardModelType } from '@prompt-booster/core';
import { testModelConnection, maskApiKey, prepareModelsForDisplay } from '@prompt-booster/core/model/services/modelService';
import { ModelConfig, CustomInterface } from '@prompt-booster/core/model/models/config';
import { useTranslation } from 'react-i18next';

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

        try {
            // 对于自定义接口，使用其 providerName 或 id
            const provider = model.isStandard ? model.id : (model.providerName || model.id);
            const { apiKey, baseUrl, model: modelName, endpoint } = model.config;

            toast.info(t('toast.testingConnection', { modelName }));

            const result = await testModelConnection(
                provider,
                apiKey,
                baseUrl,
                modelName,
                endpoint
            );

            if ('data' in result && result.data.success) {
                toast.success(t('toast.connectionSuccess', { modelName }));
            } else if ('success' in result && result.success) {
                toast.success(t('toast.connectionSuccess', { modelName }));
            } else {
                const errorMsg = 'data' in result ? result.data.message :
                    ('message' in result ? result.message : t('toast.connectionFailed'));
                toast.error(errorMsg);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? (error.message || '未知错误') : '未知错误';
            toast.error(t('toast.connectionError', { errorMessage }));
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
        isTestingConnection: (id: string) => !!testingModels[id]
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
                    endpoint: customData.endpoint || '/v1/chat/completions',
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
 * 模型数据钩子
 * 获取和处理模型列表
 */
export function useModelData() {
    const { t } = useTranslation();
    const { configs, customInterfaces, updateConfig, updateCustomInterface, deleteCustomInterface, setActiveModel } = useModelStore();

    // 所有模型数据(合并标准模型和自定义接口)
    const allModels = useMemo(() => {
        return prepareModelsForDisplay(configs, customInterfaces);
    }, [configs, customInterfaces]);

    // 处理启用/禁用模型
    const toggleModelStatus = (id: string, isStandard: boolean, enabled: boolean) => {
        // 如果是要启用内置模型，检查是否填写了 apiKey
        if (isStandard && enabled) {
            const modelConfig = configs[id as StandardModelType];

            // 检查 apiKey 是否填写
            if (!modelConfig.apiKey || modelConfig.apiKey.trim() === '') {
                toast.error(t('toast.enableModelFailed', { modelName: id, reason: t('toast.reasonNoApiKey') }));
                return;
            }

            // 检查 baseUrl 是否填写（对于需要 baseUrl 的模型）
            if (id === 'hunyuan' && (!modelConfig.baseUrl || modelConfig.baseUrl.trim() === '')) {
                toast.error(t('toast.enableModelFailed', { modelName: id, reason: t('toast.reasonNoBaseUrl') }));
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
        allModels,
        toggleModelStatus,
        deleteModel,
        setActiveModel
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

    // 当初始数据变化时更新表单
    const updateFormWithInitialData = (data: ModelConfig | CustomInterface) => {
        setFormData(data);
        setOriginalApiKey(data.apiKey || '');

        // 创建掩码API Key
        const maskedApiKey = maskApiKey(data.apiKey || '');
        setFormData(prev => ({
            ...prev,
            apiKey: maskedApiKey
        }));

        setEnableAfterSave(data.enabled || false);
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