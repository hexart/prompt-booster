// src/components/IterationDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from '@prompt-booster/ui/components/Dialog';
import { EnhancedDropdown } from '@prompt-booster/ui/components/EnhancedDropdown';
import { Template } from '@prompt-booster/core/prompt/models/template';

interface IterationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (templateId: string, direction: string) => void;
    templates: Record<string, Template>;
}

export const IterationDialog: React.FC<IterationDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    templates
}) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [iterationDirection, setIterationDirection] = useState('');

    // 组件挂载时设置默认模板
    useEffect(() => {
        if (isOpen) {
            // 默认选择第一个迭代类型的模板
            const iterateTemplates = Object.entries(templates)
                .filter(([_, template]) => template.metadata?.templateType === 'iterate');
            
            if (iterateTemplates.length > 0) {
                setSelectedTemplateId(iterateTemplates[0][0]);
            }
        }
    }, [isOpen, templates]);

    const handleSubmit = () => {
        if (selectedTemplateId && iterationDirection.trim()) {
            onSubmit(selectedTemplateId, iterationDirection);
            // 重置状态
            setIterationDirection('');
            onClose();
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="提示词迭代"
            maxWidth="max-w-xl"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md button-cancel"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-md button-confirm"
                        disabled={!selectedTemplateId || !iterationDirection.trim()}
                    >
                        确认
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 input-description">
                        请选择迭代提示词模板：
                    </label>
                    <EnhancedDropdown
                        options={Object.entries(templates)
                            .filter(([_, template]) => template.metadata?.templateType === 'iterate')
                            .map(([id, template]) => ({
                                value: id,
                                label: template.name
                            }))}
                        value={selectedTemplateId}
                        onChange={setSelectedTemplateId}
                        placeholder="选择迭代提示词模板..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 input-description">
                        请输入需要优化的方向：
                    </label>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:outline-hidden input-textarea autoscroll-border"
                        placeholder="例如：使提示词更简洁、增加特定功能描述等..."
                        value={iterationDirection}
                        onChange={(e) => setIterationDirection(e.target.value)}
                        rows={5}
                    />
                </div>
            </div>
        </Dialog>
    );
};