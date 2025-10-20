import { Template } from '../models/template';
import { TemplateProvider } from '../provider/templateProvider';
import { FileTemplateProvider } from '../provider/fileTemplateProvider';

// 创建提供者实例 - 将来可以轻松切换为数据库提供者
const templateProvider: TemplateProvider = new FileTemplateProvider();

/**
 * 获取模板提供者实例
 * @returns 模板提供者
 */
export const getTemplateProvider = (): TemplateProvider => {
    return templateProvider;
};

/**
 * 获取模板
 * @param id 模板ID
 * @returns 模板对象或null
 */
export const getTemplate = async (id: string): Promise<Template | null> => {
    return templateProvider.getTemplate(id);
};

/**
 * 获取所有模板
 * @returns 模板列表
 */
export const getAllTemplates = async (): Promise<Template[]> => {
    const templates = await templateProvider.getAllTemplates();
    return Object.values(templates);
};

/**
 * 获取所有模板并作为Record返回
 * @returns 模板Record对象，键为模板ID
 */
export const getAllTemplatesAsRecord = async (): Promise<Record<string, Template>> => {
    return templateProvider.getAllTemplates();
};

/**
 * 获取模板内容
 * @param id 模板ID
 * @returns 模板内容
 */
export const getTemplateContent = async (id: string): Promise<string> => {
    const template = await getTemplate(id);
    return template?.content || '';
};

/**
 * 按类型获取模板
 * @param type 模板类型
 * @returns 符合类型的模板列表
 */
export const getTemplatesByType = async (type: string): Promise<Template[]> => {
    const allTemplates = await getAllTemplates();
    return allTemplates.filter(template =>
        template.metadata?.templateType === type
    );
};

/**
 * 重新加载模板缓存
 */
export const reloadTemplates = async (): Promise<void> => {
    // 强制提供者实例重新加载
    if (templateProvider.resetCache) {
        templateProvider.resetCache();
    }
    await templateProvider.getAllTemplates();
};