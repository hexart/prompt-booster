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
    const hasRole = /作为|以.+身份|as (an?|a)/i.test(prompt);
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

// 导出提示词分析结果类型
export interface PromptAnalysisResult {
    score: number;
    criteria: {
        label: string;
        passed: boolean;
        feedback: string;
        suggestion?: string;
        points: number;
    }[];
    suggestions?: string[];
    encouragement?: string;
}

export async function analyzePromptWithLLM(prompt: string): Promise<PromptAnalysisResult> {
    const systemPrompt = `
你是一个专业的提示词（Prompt）质量评估助手。你的任务是：
1. 从以下提示词中，基于多维度对其质量进行打分（0–10 整数）。
2. 至少使用 5 个不同的评价维度（可从下方维度列表中选取，并可自行补充扩展）。
3. 为每个维度给出：
   - label：维度名称
   - passed：是否通过（true/false）
   - feedback：针对该维度的简要说明
   - suggestion：如果未通过，则给出可行的改进建议
4. 在顶层提供一个 \`suggestions\` 数组，列出 3～5 条全局优化方向。
5. 如果分数≥8，可返回一个鼓励性的 \`encouragement\` 字段；否则省略该字段。
6. **只返回纯 JSON**，不能带任何 Markdown、注释或多余文本。
7. 禁止使用<think>标签或任何其他XML标签。直接返回JSON。

返回格式严格如下：
\`\`\`json
{
  "score": 整数,              
  "criteria": [
    { "label": "维度名", "passed": true/false, "feedback": "说明", "suggestion": "可选改进建议" }
    // …至少五条
  ],
  "suggestions": ["建议一", "建议二", "建议三"],
  "encouragement": "可选鼓励语"
}
\`\`\`
`;

    const userMessage = `请对以下提示词进行质量分析：\n\n${prompt}`;

    const result = await callLLMWithCurrentModel({
        userMessage,
        systemMessage: systemPrompt,
        stream: false
    });

    try {
        // 🧪 debug raw string
        console.log('[LLM📩rawResult]', result);
        console.log('[LLM📩length]', result ? result.length : 0);

        const withoutThinkTags = removeThinkTags(result);
        console.log('[LLM📩withoutThink]', withoutThinkTags);
        // 如果大模型使用了 markdown code block（```json），去除它
        const cleaned = withoutThinkTags.trim().replace(/^```json[\s\r\n]*|```$/g, '');
        console.log('[LLM📩cleaned]', cleaned);

        const parsed = JSON.parse(cleaned);
        console.log('[LLM📩parsed]', parsed);

        // Remove any unexpected fields that could cause typing issues
        const { Initialization, ...validFields } = parsed;

        const criteria = validFields.criteria || [];
        const pointPerItem = Math.floor(10 / criteria.length);
        const maxScore = pointPerItem * criteria.length;
        const pointsRemaining = 10 - maxScore; // 可能为1～(length - 1)

        const enhancedCriteria = criteria.map((c: any, i: number) => ({
            ...c,
            points: c.passed ? (i === 0 ? pointPerItem + pointsRemaining : pointPerItem) : 0
        }));

        return {
            ...validFields,
            criteria: enhancedCriteria,
            suggestions: validFields.suggestions && validFields.suggestions.length > 0
                ? validFields.suggestions
                : enhancedCriteria.filter((c: any) => !c.passed && c.suggestion).map((c: any) => c.suggestion).filter(Boolean)
        };
    } catch (e) {
        console.error('[LLM❌Parse Error]', e);
        throw new Error('LLM 评分结果解析失败');
    }
}