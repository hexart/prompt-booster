// packages/core/src/utils/prompt-utils.ts
import { llmService } from '../services/llmService';
import { getAllTemplatesAsRecord } from '../services/templateService';
import { Template } from '../models/template';

let templatesCache: Record<string, Template> | null = null;

async function getAnalyzeTemplate(currentLanguage?: string): Promise<Template> {
  if (!templatesCache) {
    templatesCache = await getAllTemplatesAsRecord();
  }

  // 第一步：筛选出所有 'analyze' 类型的模板
  const analyzeTemplates: Record<string, Template> = {};
  Object.entries(templatesCache).forEach(([id, template]) => {
    if (template.metadata?.templateType === 'analyze') {
      analyzeTemplates[id] = template;
    }
  });

  if (Object.keys(analyzeTemplates).length === 0) {
    throw new Error('No analyze templates found');
  }

  // 第二步：使用现有的本地化处理逻辑
  const {
    displayTemplates,
    getActualTemplateId
  } = handleTemplateLocalization(analyzeTemplates, currentLanguage || 'en');

  // 第三步：获取第一个（也是唯一的）分析模板
  const firstTemplateKey = Object.keys(displayTemplates)[0];
  if (!firstTemplateKey) {
    throw new Error('No localized analyze template found');
  }

  const actualTemplateId = getActualTemplateId(firstTemplateKey);
  const template = templatesCache[actualTemplateId];

  console.log('🎯 通过本地化选择分析模板:', actualTemplateId);
  return template;
}

/**
 * 根据语言代码生成对应的语言指令
 * @param language 语言代码
 * @returns 对应语言的输出指令
 */
export function getLanguageInstruction(language?: string): string {
  if (!language) return '';

  if (language.includes('zh')) {
    if (language.includes('Hant')) {
      return '請使用繁體中文輸出結果。';
    } else {
      return '请使用中文输出结果。';
    }
  } else if (language.includes('en')) {
    return 'Please output the result in English.';
  } else if (language.includes('ja')) {
    return '結果を日本語で出力してください。';
  } else if (language.includes('ko')) {
    return '결과를 한국어로 출력해 주세요.';
  } else if (language.includes('de')) {
    return 'Bitte geben Sie das Ergebnis auf Deutsch aus.';
  } else if (language.includes('nl')) {
    return 'Geef het resultaat in het Nederlands weer.';
  } else if (language.includes('ru')) {
    return 'Пожалуйста, выведите результат на русском языке.';
  } else if (language.includes('es')) {
    return 'Por favor, muestre el resultado en español.';
  } else if (language.includes('fr')) {
    return 'Veuillez afficher le résultat en français.';
  } else if (language.includes('ar')) {
    return 'الرجاء إظهار النتيجة باللغة العربية.';
  } else if (language.includes('pt')) {
    return 'Por favor, apresente o resultado em português.';
  } else if (language.includes('hi')) {
    return 'कृपया परिणाम हिंदी में प्रदर्शित करें।';
  } else {
    // 默认使用英语
    return 'Please output the result in English.';
  }
}

/**
 * 移除文本中的<think>标签及其内容
 * @param text 输入文本
 * @returns 清理后的文本
 */
export function removeThinkTags(text: string): string {
  if (!text) return text;

  // 使用正则表达式移除<think>标签及其内容
  // [\s\S]*? 匹配任意字符(包括换行符)，非贪婪模式
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/**
 * 清理优化后提示词，移除标签和元数据
 * @param optimizedPrompt 原始优化提示词
 * @returns 清理<think>后的可用作系统提示词的内容
 */
export function cleanOptimizedPrompt(optimizedPrompt: string): string {
  if (!optimizedPrompt) return '';

  const cleaned = removeThinkTags(optimizedPrompt);

  // 移除其他常见的元标签
  return cleaned
    // .replace(/^```[\s\S]*?```/g, '') // 移除代码块
    .replace(/<!--[\s\S]*?-->/g, '') // 移除HTML注释
    .trim();
}

/**
 * 评估维度项的结构
 * 表示提示词分析中的单个评估维度，包含评分信息
 * 用于前端展示和最终分析结果
 */
export interface CriterionItem {
  label: string;         // 维度名称（如"任务目标明确性"）
  passed: boolean;       // 该维度是否通过评估
  feedback: string;      // 对该维度的具体评价内容
  suggestion?: string;   // 针对该维度的改进建议（可选）
  points: number;        // 该维度获得的分数
  maxPoints?: number;    // 该维度的最高可能分数（可选）
}

/**
 * 提示词分析的完整结果结构
 * 包含总分、各维度评估、建议和鼓励语
 * 由analyzePromptQuality和analyzePromptWithLLM函数返回
 * 用作前端组件的状态类型
 */
export interface PromptAnalysisResult {
  score: number;              // 总评分（0-10分）
  criteria: CriterionItem[];  // 各评估维度的详细信息
  suggestions?: string[];     // 综合优化建议（可选）
  encouragement?: string;     // 鼓励性评语（可选）
}

/**
 * 大模型返回的单个评估维度结构
 * 与CriterionItem类似，但不包含分数相关字段
 * 用于解析LLM原始返回内容
 */
export interface LLMCriterionResponse {
  label: string;        // 维度名称
  passed: boolean;      // 该维度是否通过评估
  feedback: string;     // 对该维度的具体评价内容
  suggestion?: string;  // 针对该维度的改进建议（可选）
}

/**
 * 大模型返回的原始分析结果结构
 * 包含评估维度数组和可能的建议
 * 用于解析和处理LLM的JSON响应
 */
export interface LLMAnalysisResponse {
  criteria?: LLMCriterionResponse[];  // 评估维度数组（可能不存在）
  score?: number;                     // LLM可能返回的分数（我们会忽略它）
  suggestions?: string[];             // LLM提供的综合建议（可选）
}

export async function analyzePromptWithLLM(
  prompt: string,
  currentLanguage?: string
): Promise<PromptAnalysisResult> {
  const cleanedPrompt = removeThinkTags(prompt);

  // 获取语言指令
  const languageInstruction = getLanguageInstruction(currentLanguage);

  try {
    // 🎯 使用灵活的模板选择（不再硬编码ID）
    const template = await getAnalyzeTemplate(currentLanguage);

    // 构建系统提示词：模板内容 + 语言指令
    const systemPrompt = `${template.content}\n\n${languageInstruction}`;

    // 构建用户消息：保持语言指令重复以确保优先级
    const userMessage = `请对以下提示词进行质量分析。如果它确实表现优秀，请给予高分评价；如果有不足，请如实指出并提供改进建议：\n\n${cleanedPrompt}，\n##Important: ${languageInstruction}`;

    console.log('🌍 语言指令:', languageInstruction);
    console.log('🔍 系统提示词最后20字符:', systemPrompt.slice(-20));
    console.log('🔍 用户消息最后20字符:', userMessage.slice(-20));

    const result = await llmService.callLLM({
      userMessage,
      systemMessage: systemPrompt,
      stream: false
    });

    // 后续处理逻辑保持不变...
    try {
      const withoutThinkTags = removeThinkTags(result);
      const cleaned = withoutThinkTags.trim().replace(/^```json[\s\r\n]*|```$/g, '');
      const parsed = JSON.parse(cleaned) as {
        criteria?: Array<{
          label: string;
          points: number;
          feedback: string;
          suggestion?: string;
        }>;
        score?: number;
        suggestions?: string[];
        encouragement?: string;
      };

      const criteria = parsed.criteria || [];
      const enhancedCriteria: CriterionItem[] = criteria.map((c) => ({
        label: c.label,
        points: typeof c.points === 'number' ? c.points : 0,
        feedback: c.feedback,
        suggestion: c.suggestion,
        maxPoints: 3,
        passed: (typeof c.points === 'number' ? c.points : 0) > 0
      }));

      let calculatedScore: number = enhancedCriteria.reduce((sum: number, c: CriterionItem) => sum + c.points, 0);

      if (calculatedScore > 10) {
        const scaleFactor: number = 10 / calculatedScore;
        enhancedCriteria.forEach((c: CriterionItem) => {
          c.points = Math.round(c.points * scaleFactor * 10) / 10;
          c.passed = c.points > 0;
        });
        calculatedScore = 10;
      }

      const finalResult: PromptAnalysisResult = {
        score: Math.round(calculatedScore * 10) / 10,
        criteria: enhancedCriteria,
        suggestions: parsed.suggestions || [],
        encouragement: parsed.encouragement
      };

      return finalResult;
    } catch (parseError) {
      console.error('[LLM❌Parse Error]', parseError);
      throw new Error('LLM 评分结果解析失败');
    }
  } catch (templateError) {
    console.error('[Template❌Load Error]', templateError);
    throw new Error('模板加载失败，将使用本地分析');
  }
}

/**
 * 根据当前语言处理模板本地化
 * 
 * 该函数根据用户当前语言选择合适的模板显示版本。
 * 命名规则：
 * - 基本ID使用下划线分隔词（如 general_optimize）
 * - 语言后缀使用连字符加语言代码（如 general_optimize-zh）
 * - 无语言后缀的视为英文默认版本
 * 
 * 未来表设计：
 * 表名: templates
 * 
 * 字段:
 * - id: 整数, 主键, 自增 (数据库记录的唯一标识)
 * - template_key: 字符串, 唯一, 非空 (功能性标识符，如"general_optimize")
 * - language_code: 字符串, 非空 (如"zh", "en"，默认为"en")
 * - name: 字符串, 非空 (显示名称)
 * - content: 文本, 非空 (模板内容)
 * - metadata: JSON (元数据)
 * - ...其他字段
 * 
 * @param templates 原始模板集合
 * @param currentLanguage 当前语言代码
 * @returns 本地化后的模板集合和ID转换函数
 */
export const handleTemplateLocalization = (
  templates: Record<string, any>,
  currentLanguage: string
): {
  displayTemplates: Record<string, any>;
  getActualTemplateId: (displayId: string) => string;
} => {
  // 提取简化的语言代码
  const simpleLang = currentLanguage.split('-')[0];

  // 创建返回的结果对象
  const displayTemplates: Record<string, any> = {};
  const templateIdMap: Record<string, string> = {};

  // 第一步：收集所有不带语言后缀的模板（默认英文版）
  Object.entries(templates).forEach(([id, template]) => {
    if (!id.includes('-')) {
      displayTemplates[id] = template;
      templateIdMap[id] = id;
    }
  });

  // 第二步：尝试替换为当前语言的模板
  if (simpleLang !== 'en') {
    Object.entries(templates).forEach(([id, template]) => {
      if (id.endsWith(`-${simpleLang}`)) {
        const baseId = id.substring(0, id.lastIndexOf('-'));
        if (displayTemplates[baseId]) {
          displayTemplates[baseId] = template;
          templateIdMap[baseId] = id;
        }
      }
    });
  }

  return {
    displayTemplates,
    getActualTemplateId: (id) => templateIdMap[id] || id
  };
};