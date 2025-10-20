// apps/web/src/core/prompt/models/template.ts
/**
 * 模板类型枚举
 */
export type TemplateType = 'optimize' | 'iterate'| 'analyze' | 'custom';

/**
 * 模板元数据接口
 */
export interface TemplateMetadata {
    /**
     * 版本号
     */
    version: string;
    
    /**
     * 最后修改时间
     */
    lastModified: number;
    
    /**
     * 作者
     */
    author: string;
    
    /**
     * 描述
     */
    description?: string;
    
    /**
     * 模板类型
     */
    templateType: TemplateType;
    
    /**
     * 其他自定义元数据
     */
    [key: string]: any;
}

/**
 * 优化模板接口
 */
export interface Template {
    /**
     * 唯一标识符
     */
    id: string;
    
    /**
     * 模板名称
     */
    name: string;
    
    /**
     * 模板内容（系统提示词）
     */
    content: string;
    
    /**
     * 模板元数据
     */
    metadata: TemplateMetadata;
    
    /**
     * 是否为内置模板
     */
    isBuiltin?: boolean;
    
    /**
     * 创建时间
     */
    createdAt?: number;
    
    /**
     * 最后更新时间
     */
    updatedAt?: number;
}