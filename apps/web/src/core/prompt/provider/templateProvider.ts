// templateProvider.ts
import { Template } from '../models/template';

export interface TemplateProvider {
    getAllTemplates(): Promise<Record<string, Template>>;
    getTemplate(id: string): Promise<Template | null>;
    resetCache?(): void;
    // 如果需要修改模板，可以添加以下方法
    saveTemplate?(template: Template): Promise<void>;
    deleteTemplate?(id: string): Promise<void>;
}