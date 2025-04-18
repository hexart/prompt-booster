// fileTemplateProvider.ts
import defaultTemplates from '../templates/default-templates.json';
import { Template } from '../models/template';
import { TemplateProvider } from './templateProvider';

// 为导入的JSON定义更具体的类型
type DefaultTemplatesType = typeof defaultTemplates;

export class FileTemplateProvider implements TemplateProvider {
    private cachedTemplates: Record<string, Template> | null = null;

    // 重置缓存的公共方法
    resetCache(): void {
        this.cachedTemplates = null;
    }

    async getAllTemplates(): Promise<Record<string, Template>> {
        if (this.cachedTemplates) {
            return this.cachedTemplates;
        }

        try {
            // 使用更精确的类型断言
            const templates = { ...defaultTemplates } as DefaultTemplatesType;

            // 添加时间戳等逻辑
            const now = Date.now();
            for (const key in templates) {
                // 使用类型断言确保TypeScript知道这是安全的
                if (!(templates as any)[key].createdAt) {
                    (templates as any)[key].createdAt = now;
                }
                if (!(templates as any)[key].updatedAt) {
                    (templates as any)[key].updatedAt = now;
                }
            }

            this.cachedTemplates = templates as unknown as Record<string, Template>;
            return this.cachedTemplates;
        } catch (err) {
            console.error('Failed to load templates:', err);
            return {};
        }
    }

    async getTemplate(id: string): Promise<Template | null> {
        const templates = await this.getAllTemplates();
        return templates[id] || null;
    }
}