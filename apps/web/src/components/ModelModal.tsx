// apps/web/src/components/ModelModal.tsx
import React, { useEffect } from 'react';
import { type StandardModelType, type ModelConfig, type CustomInterface } from '@prompt-booster/core/model/models/config';
import { createClient } from '@prompt-booster/api/factory';
import { validateModelConfig, getDefaultBaseUrl } from '@prompt-booster/core/model/services/modelService';
import { Dialog, ModelSelector, toast } from '@prompt-booster/ui';
import { useModelForm } from '../modelhooks/model-hooks';
import { EyeIcon, EyeClosedIcon } from 'lucide-react';

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
                        className="px-4 py-2 rounded-md transition-colors button-cancel"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !formData.apiKey}
                        className="px-4 py-2 rounded-md transition-colors button-confirm"
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {isCustom && (
                    <div>
                        <label className="block text-sm font-medium mb-1 input-label">供应商名称</label>
                        <input
                            type="text"
                            name="providerName"
                            value={(formData as CustomInterface).providerName || ''}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded input"
                            placeholder="例如: OpenAI"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1 input-laebel">API Key</label>
                    <div className="relative">
                        <input
                            type={isMaskedApiKey ? "text" : "text"}
                            name="apiKey"
                            value={formData.apiKey || ''}
                            onChange={handleInputChange}
                            className="w-full overflow-hidden truncate p-2 pr-12 border rounded input"
                            placeholder="输入你的API Key"
                        />
                        {originalApiKey && (
                            <button
                                type="button"
                                onMouseDown={() => showApiKey()}
                                onMouseUp={() => hideApiKey()}
                                onMouseLeave={() => hideApiKey()}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm input-display-button"
                            >
                                {isMaskedApiKey ? <EyeClosedIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        )}
                    </div>
                    <p className="mt-1 text-xs input-description">
                        {isMaskedApiKey
                            ? "按住显示按钮不松开显示API Key"
                            : "松开鼠标恢复隐藏"}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 input-laebel">API基础URL</label>
                    <input
                        type="text"
                        name="baseUrl"
                        value={formData.baseUrl || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded input"
                        placeholder={isCustom
                            ? "输入API基础URL"
                            : getDefaultBaseUrl(modelType as StandardModelType)}
                    />
                    {!isCustom && (
                        <p className="mt-1 text-xs input-description">
                            默认URL: {getDefaultBaseUrl(modelType as StandardModelType) || "未设置"}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 input-laebel">API端点路径</label>
                    <input
                        type="text"
                        name="endpoint"
                        value={formData.endpoint || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded input"
                        placeholder="/v1/chat/completions"
                    />
                    <p className="mt-1 text-xs input-description">
                        {isCustom
                            ? "端点路径，例如: /v1/chat/completions 或 /api/generate (不包含基础URL)"
                            : "留空将使用默认端点，对于大多数模型是/v1/chat/completions"}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 input-laebel">模型</label>
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
                        <label className="block text-sm font-medium mb-1 input-laebel">接口名称</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            disabled={true}
                            className="w-full p-2 border rounded input input-disabled"
                            placeholder="自动生成的接口名称"
                        />
                        <p className="mt-1 text-xs input-description">
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
                        className="w-4 h-4 input"
                    />
                    <label htmlFor="enableAfterSave" className="ml-2 text-sm font-medium input-laebel">
                        保存后启用模型
                    </label>
                </div>
            </div>
        </Dialog>
    );
};

export default ModelModal;