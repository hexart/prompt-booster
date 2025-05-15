// packages/core/src/utils/prompt-utils.ts
import { callLLMWithCurrentModel } from '../services/promptService';


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
 * 分析提示词质量（新增）
 * @param prompt 提示词文本
 * @returns 质量分析结果
 */
export function analyzePromptQuality(prompt: string): {
    score: number;
    criteria: Array<{
        label: string;
        passed: boolean;
        feedback: string;
        suggestion?: string;
        points: number;
    }>;
    encouragement?: string;
} {
    const criteria = [];

    // 维度 1：提示词长度（不参与评分，仅提示）
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount < 20) {
        criteria.push({
            label: '提示词长度',
            passed: false,
            feedback: '当前提示词可能略短，信息量较少，可能导致模型理解不够充分。',
            suggestion: '建议补充一些背景或目标描述，使模型更清楚你的意图。',
            points: 0
        });
    } else if (wordCount > 100) {
        criteria.push({
            label: '提示词长度',
            passed: true,
            feedback: '提示词较长，请确保内容清晰、有结构，避免冗余影响模型理解。',
            points: 2
        });
    } else {
        criteria.push({
            label: '提示词长度',
            passed: true,
            feedback: '提示词长度适中。',
            points: 2
        });
    }

    // 维度 2：是否指定角色
    const hasRole = /作为|以.+身份|as (an?|a)|[Rr]ole|扮演|担任|角色/i.test(prompt);
    if (hasRole) {
        criteria.push({
            label: '指定 AI 角色',
            passed: true,
            feedback: '你已指定 AI 扮演的身份，有助于模型定位任务语气。',
            points: 2
        });
    } else {
        criteria.push({
            label: '指定 AI 角色',
            passed: false,
            feedback: '未说明 AI 应以什么身份回答。',
            suggestion: '可以加上“作为一位简历导师…”帮助模型更贴近你的目标。',
            points: 0
        });
    }

    // 维度 3：是否有任务动词
    const hasGoalVerb = /(生成|总结|分析|撰写|提取|列出|写|create|generate|summarize|analyze)/i.test(prompt);
    if (hasGoalVerb) {
        criteria.push({
            label: '明确任务目标',
            passed: true,
            feedback: '已包含任务指令，模型更容易知道你想要什么。',
            points: 2
        });
    } else {
        criteria.push({
            label: '明确任务目标',
            passed: false,
            feedback: '缺少清晰的任务动词，模型可能不知从何下手。',
            suggestion: '建议补充“请撰写…”、“请列出…”等任务型语句。',
            points: 0
        });
    }

    // 维度 4：是否表达输出风格或预期
    const hasExpectedStyle = /(希望|呈现|输出|写成|生成|看起来像|请以|以.*方式|should|in the form of|in a.*style|as a.*response|present.*as)/i.test(prompt);
    if (hasExpectedStyle) {
        criteria.push({
            label: '表达输出风格或预期',
            passed: true,
            feedback: '你已经表达了希望如何呈现结果，模型能据此做出合适回应。',
            points: 2
        });
    } else {
        criteria.push({
            label: '表达输出风格或预期',
            passed: false,
            feedback: '提示词未说明你希望结果怎么呈现，模型可能只给出泛泛回应。',
            suggestion: '你可以简单补充一句“请用简明方式呈现”或“写成宣传文案”，模型会理解得更清楚。',
            points: 0
        });
    }


    // 维度 5：是否结构化表达（如段落、步骤）
    const hasStructure = /\n/.test(prompt) ||
        /(第一|首先|然后|最后|步骤|接下来)/.test(prompt) ||
        /(first(ly)?|then|next|finally|step|in order)/i.test(prompt);
    if (hasStructure) {
        criteria.push({
            label: '结构清晰表达',
            passed: true,
            feedback: '提示词有分段或结构词，模型更容易理解复杂任务。',
            points: 2
        });
    } else {
        criteria.push({
            label: '结构清晰表达',
            passed: false,
            feedback: '提示词是长句或无结构，可能让模型难以解析重点。',
            suggestion: '建议将内容分段，例如“第一步…”、“然后…”能提升理解效果。',
            points: 0
        });
    }

    const score = criteria.reduce((acc, c) => acc + (c.passed ? 2 : 0), 0);

    return {
        score,
        criteria,
        encouragement: score === 10 ? '🎉 太棒了！你的提示词结构完整、意图清晰，是非常优秀的提示词！' : undefined
    };
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
    let languageInstruction = '';
    if (currentLanguage) {
        if (currentLanguage.includes('zh')) {
            languageInstruction = '请使用中文输出结果。';
        } else if (currentLanguage.includes('en')) {
            languageInstruction = 'Please output the result in English.';
        } else if (currentLanguage.includes('ja')) {
            languageInstruction = '結果を日本語で出力してください。';
        } else {
            // 默认使用英语
            languageInstruction = 'Please output the result in English.';
        }
    } else {
        // 如果没有提供语言，默认使用中文
        languageInstruction = '请使用中文输出结果。';
    }
    const systemPrompt = `
你是一个专业的提示词（Prompt）质量评估助手，你将对用户提供的提示词进行公正、创造性且全面的评估。

# 评估原则：
- 评估应基于提示词实际效果，而非固定标准
- 捕捉提示词的独特亮点和可能的不足
- 提供有建设性的、具体的改进建议
- 评价应真实反映提示词的实际水平，不人为降低或抬高

# 评估方法：
1. 选择3-5个与该提示词最相关的评估维度
2. 为每个维度给出0-3分的评分：
   - 0分：完全未达到要求
   - 1分：基本达到要求
   - 2分：完全满足要求
   - 3分：表现优秀，超出预期
3. 自由分配分数，但请确保：
   - 真正优秀的提示词应该获得高分
   - 总分控制在10分以内
   - 分数应反映各维度的重要性和表现
   - 不必强制使总分达到10分，应反映实际质量
4. 为每个维度提供具体评价和建议
5. 提供一句个性化的鼓励语，具体反映该提示词的特点：
   - 对优秀提示词，赞赏其突出优势和专业性
   - 对良好提示词，肯定其优点并点明改进方向
   - 对基础提示词，给予鼓励并指明关键改进点
   - 鼓励语应精准反映提示词的实际水平和特色，避免泛泛而谈

# 响应格式：
返回纯JSON对象，格式如下：
{
  "criteria": [
    {
      "label": "维度名称",
      "points": 分数(0-3),
      "feedback": "针对该维度的具体评价",
      "suggestion": "针对该维度的改进建议"
    },
    // 更多维度评估...
  ],
  "score": 总分(计算所有维度分数之和，最高10分),
  "suggestions": ["整体优化建议1", "整体优化建议2"],
  "encouragement": "基于提示词特点的个性化鼓励语，应明确反映其优势和特色"
}

${languageInstruction}
`;

    const userMessage = `请对以下提示词进行质量分析。如果它确实表现优秀，请给予高分评价；如果有不足，请如实指出并提供改进建议，${languageInstruction}：\n\n${cleanedPrompt}`;

    const result = await callLLMWithCurrentModel({
        userMessage,
        systemMessage: systemPrompt,
        stream: false
    });

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

        // 验证并调整评分逻辑
        const criteria = parsed.criteria || [];

        // 确保每个criterion都有正确的字段
        const enhancedCriteria: CriterionItem[] = criteria.map((c: {
            label: string;
            points: number;
            feedback: string;
            suggestion?: string;
        }) => ({
            label: c.label,
            points: typeof c.points === 'number' ? c.points : 0,
            feedback: c.feedback,
            suggestion: c.suggestion,
            maxPoints: 3, // 每个维度的最高分为3分
            passed: (typeof c.points === 'number' ? c.points : 0) > 0 // 只要得分大于0就算通过
        }));

        // 计算总分
        let calculatedScore: number = enhancedCriteria.reduce((sum: number, c: CriterionItem) => sum + c.points, 0);

        // 如果总分超过10分，按比例缩减
        if (calculatedScore > 10) {
            const scaleFactor: number = 10 / calculatedScore;
            enhancedCriteria.forEach((c: CriterionItem) => {
                c.points = Math.round(c.points * scaleFactor * 10) / 10; // 保留一位小数
                // 确保缩放后分数为0的项也更新passed状态
                c.passed = c.points > 0;
            });
            calculatedScore = 10; // 确保总分为10
        }

        // 直接使用大模型提供的鼓励语
        const finalResult: PromptAnalysisResult = {
            score: Math.round(calculatedScore * 10) / 10, // 保留一位小数
            criteria: enhancedCriteria,
            suggestions: parsed.suggestions || [],
            encouragement: parsed.encouragement
        };

        return finalResult;
    } catch (e) {
        console.error('[LLM❌Parse Error]', e);
        throw new Error('LLM 评分结果解析失败');
    }
}