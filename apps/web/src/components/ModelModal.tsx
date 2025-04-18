// apps/web/src/components/ModelModal.tsx
import React, { useEffect } from 'react';
import { type StandardModelType, type ModelConfig, type CustomInterface } from '@prompt-booster/core/model/models/config';
import { createClient } from '@prompt-booster/api/factory';
import { validateModelConfig, getDefaultBaseUrl } from '@prompt-booster/core/model/services/modelService';
import { Dialog, ModelSelector, toast } from '@prompt-booster/ui';
import { useModelForm } from '../modelhooks/model-hooks';

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
        hideApiKey
    } = useModelForm(initialData);

    const [isSaving, setIsSaving] = React.useState(false);

    useEffect(() => {
        if (modelOptions.length > 0) {
            console.log('modelOptions updated:', modelOptions);
        }
    }, [modelOptions]);

    // 当初始数据变化时更新表单
    useEffect(() => {
        updateFormWithInitialData(initialData);
    }, [initialData]);

    const handleSave = async () => {
        // 验证表单
        const validation = validateModelConfig(formData);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }

        // 如果所有必要字段都有值，自动设为启用状态
        const enabled = enableAfterSave && Boolean(formData.apiKey && formData.model && (!isCustom || (formData as CustomInterface).providerName));

        // 准备保存数据
        const dataToSave = {
            ...formData,
            apiKey: isMaskedApiKey ? originalApiKey : formData.apiKey,
            enabled
        };

        setIsSaving(true);
        try {
            await onSave(dataToSave, modelId);
            onClose();
        } catch (error) {
            console.error('保存模型配置失败:', error);
            toast.error('保存失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
            title={isCustom ? (isNewInterface ? '新建自定义接口' : '编辑自定义接口') : `编辑模型: ${modelType}`}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !formData.apiKey}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800 dark:disabled:text-blue-200"
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {isCustom && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-white">供应商名称</label>
                        <input
                            type="text"
                            name="providerName"
                            value={(formData as CustomInterface).providerName || ''}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="例如: OpenAI"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-300">API Key</label>
                    <div className="relative">
                        <input
                            type={isMaskedApiKey ? "text" : "text"}
                            name="apiKey"
                            value={formData.apiKey || ''}
                            onChange={handleInputChange}
                            className="w-full overflow-hidden truncate p-2 pr-12 border rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="输入你的API Key"
                        />
                        {originalApiKey && (
                            <button
                                type="button"
                                onMouseDown={() => showApiKey()}
                                onMouseUp={() => hideApiKey()}
                                onMouseLeave={() => hideApiKey()}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm border-gray-300 text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                {isMaskedApiKey ? '显示' : '隐藏'}
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isMaskedApiKey
                            ? "按住显示按钮不松开显示API Key"
                            : "输入新的API Key或查看完整密钥"}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-300">API基础URL</label>
                    <input
                        type="text"
                        name="baseUrl"
                        value={formData.baseUrl || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder={isCustom
                            ? "输入API基础URL"
                            : getDefaultBaseUrl(modelType as StandardModelType)}
                    />
                    {!isCustom && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            默认URL: {getDefaultBaseUrl(modelType as StandardModelType) || "未设置"}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-300">API端点路径</label>
                    <input
                        type="text"
                        name="endpoint"
                        value={formData.endpoint || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="/v1/chat/completions"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isCustom
                            ? "端点路径，例如: /v1/chat/completions 或 /api/generate (不包含基础URL)"
                            : "留空将使用默认端点，对于大多数模型是/v1/chat/completions"}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-300">模型</label>
                    <ModelSelector
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
                                // 只有当有 apiKey 和 baseUrl 时才尝试获取模型列表
                                if (!formData.apiKey || !formData.baseUrl) {
                                    toast.error('请先填写 API Key 和 Base URL');
                                    return [];
                                }

                                const provider = isCustom ?
                                    (formData as CustomInterface).providerName || 'custom' :
                                    modelType;

                                const client = createClient({
                                    provider,
                                    apiKey: originalApiKey,
                                    baseUrl: formData.baseUrl,
                                    model: 'default',
                                    endpoints: {
                                        chat: formData.endpoint || '/v1/chat/completions',
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
                                toast.error('获取模型列表失败');
                                return [];
                            }
                        }}
                        placeholder="选择或输入模型名称"
                        className="w-full"
                        disabled={!formData.apiKey || !formData.baseUrl}
                    />
                </div>

                {isCustom && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-300">接口名称</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            disabled={true}
                            className="w-full p-2 border rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="自动生成的接口名称"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            接口名称自动由供应商名称和模型名称组合生成
                        </p>
                    </div>
                )}

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="enableAfterSave"
                        checked={enableAfterSave}
                        onChange={(e) => setEnableAfterSave(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-xs focus:ring-blue-500"
                    />
                    <label htmlFor="enableAfterSave" className="ml-2 text-sm font-medium text-gray-500">
                        保存后启用模型
                    </label>
                </div>
            </div>
        </Dialog>
    );
};

export default ModelModal;