// apps/web/src/hooks/usePromptTemplates.ts
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllTemplatesAsRecord } from '~/core/prompt/services/templateService';
import { Template } from '~/core/prompt/models/template';
import { handleTemplateLocalization } from '~/core/prompt/utils/promptUtils';

export const usePromptTemplates = () => {
  const { t, i18n } = useTranslation();
  
  // 基础状态
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  
  // 本地化相关状态
  const [displayTemplates, setDisplayTemplates] = useState<Record<string, Template>>({});
  const [templateIdMapping, setTemplateIdMapping] = useState<Record<string, string>>({});
  
  // 检查i18n是否已初始化 - 更严格的检查
  const isI18nReady = Boolean(
    i18n && 
    typeof i18n.language === 'string' && 
    i18n.language.length > 0 &&
    typeof t === 'function'
  );

  // 加载模板
  useEffect(() => {
    // 如果i18n还没准备好，延迟执行
    if (!isI18nReady) {
      console.warn('⏳ i18n未就绪，延迟加载模板...');
      setIsTemplatesLoading(true);
      return;
    }
    
    const loadTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const templatesRecord = await getAllTemplatesAsRecord();
        setTemplates(templatesRecord);

        // 应用模板本地化，确保i18n.language有默认值
        const currentLang = i18n.language || 'zh-CN';
        const {
          displayTemplates: localizedTemplates,
          getActualTemplateId: idMapper,
        } = handleTemplateLocalization(templatesRecord, currentLang);
        
        setDisplayTemplates(localizedTemplates);
        
        // 预计算所有ID映射，避免存储函数
        const mappings: Record<string, string> = {};
        Object.keys(localizedTemplates).forEach(id => {
          mappings[id] = idMapper(id);
        });
        setTemplateIdMapping(mappings);

        if (Object.keys(templatesRecord).length > 0) {
          console.log('✅ 模板加载成功:', Object.keys(templatesRecord).length);
        } else {
          console.info(t("toast.noTemplatesAvailable"));
        }
      } catch (error) {
        console.error('❌ 加载模板失败:', error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [i18n.language, isI18nReady, t]);

  // 获取实际模板ID的函数（现在是纯函数，不存储在状态中）
  const getActualTemplateId = useCallback((displayId: string): string => {
    return templateIdMapping[displayId] || displayId;
  }, [templateIdMapping]);

  // 获取优化类型的模板选项
  const getOptimizeTemplateOptions = useCallback(() => {
    return Object.entries(displayTemplates)
      .filter(([_, template]) => template.metadata?.templateType === "optimize")
      .map(([id, template]) => ({
        value: id,
        label: template.name,
      }));
  }, [displayTemplates]);

  // 获取所有类型的模板选项
  const getAllTemplateOptions = useCallback(() => {
    return Object.entries(displayTemplates)
      .map(([id, template]) => ({
        value: id,
        label: template.name,
        type: template.metadata?.templateType || 'unknown',
      }));
  }, [displayTemplates]);

  // 按类型获取模板选项
  const getTemplateOptionsByType = useCallback((templateType: string) => {
    return Object.entries(displayTemplates)
      .filter(([_, template]) => template.metadata?.templateType === templateType)
      .map(([id, template]) => ({
        value: id,
        label: template.name,
      }));
  }, [displayTemplates]);

  return {
    // 状态
    templates,
    displayTemplates,
    isTemplatesLoading,
    
    // 方法
    getActualTemplateId,
    getOptimizeTemplateOptions,
    getAllTemplateOptions,
    getTemplateOptionsByType,
    
    // 计算属性
    hasTemplates: Object.keys(templates).length > 0,
    templateCount: Object.keys(templates).length,
    
    // 当前语言信息（调试用）
    currentLanguage: i18n.language || 'zh-CN',
  };
};
