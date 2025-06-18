// src/components/IterationDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from '@prompt-booster/ui/components/Dialog';
import { EnhancedDropdown } from '@prompt-booster/ui/components/EnhancedDropdown';
import { useTemplates } from '@prompt-booster/core/prompt/hooks/useTemplates';
import { useTranslation } from 'react-i18next';

interface IterationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateId: string, direction: string) => void;
}

export const IterationDialog: React.FC<IterationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { getTemplateOptionsByType } = useTemplates();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [iterationDirection, setIterationDirection] = useState('');

  // 获取迭代类型的模板选项
  const iterateTemplateOptions = getTemplateOptionsByType('iterate');

  // 组件挂载时设置默认模板
  useEffect(() => {
    if (isOpen) {
      // 使用第一个选项
      if (iterateTemplateOptions.length > 0) {
        setSelectedTemplateId(iterateTemplateOptions[0].value);
      }
    }
  }, [isOpen, iterateTemplateOptions]);

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
      clickOutside={false}
      title={t('promptBooster.iterationDialog.title')}
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 button-cancel"
          >
            {t('common.buttons.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 button-confirm"
            disabled={!selectedTemplateId || !iterationDirection.trim()}
          >
            {t('common.buttons.confirm')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 input-description" htmlFor='template-select'>
            {t('promptBooster.iterationDialog.selectTemplate')}
          </label>
          <EnhancedDropdown
            id="template-select"
            options={iterateTemplateOptions}
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
            placeholder={t("promptBooster.templatePlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 input-description" htmlFor='iterationDirection'>
            {t('promptBooster.iterationDialog.enterDirection')}
          </label>
          <textarea
            id='iterationDirection'
            className="w-full p-3 border rounded-lg focus:outline-hidden input-textarea autoscroll-border"
            placeholder={t('promptBooster.iterationDialog.directionPlaceholder')}
            value={iterationDirection}
            onChange={(e) => setIterationDirection(e.target.value)}
            rows={5}
          />
        </div>
      </div>
    </Dialog>
  );
};