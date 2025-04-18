// packages/core/src/utils/prompt-utils.ts
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
    feedback: Array<{text: string; isNegative: boolean}>;
} {
    if (!prompt) {
        return { score: 0, feedback: [{text: '提示词为空', isNegative: true}] };
    }

    const feedback: Array<{text: string; isNegative: boolean}> = [];
    let score = 0;

    // 长度检查
    const words = prompt.split(/\s+/).length;
    if (words < 10) {
        feedback.push({text: '提示词过短，可能缺乏足够的信息', isNegative: true});
        score += 1;
    } else if (words > 20 && words <= 100) {
        feedback.push({text: '提示词长度适中', isNegative: false});
        score += 3;
    } else if (words > 100) {
        feedback.push({text: '提示词较长，包含详细信息', isNegative: false});
        score += 5;
    }

    // 结构检查
    if (prompt.includes('\n')) {
        feedback.push({text: '提示词包含结构化段落，有助于理解', isNegative: false});
        score += 2;
    }

    // 关键词检查
    const roleKeywords = ['作为', '角色', 'role', 'as a'];
    const goalKeywords = ['目标', '需要', 'goal', 'objective'];
    const formatKeywords = ['格式', '输出', 'format', 'output'];

    let hasRole = false;
    let hasGoal = false;
    let hasFormat = false;

    for (const keyword of roleKeywords) {
        if (prompt.toLowerCase().includes(keyword)) {
            hasRole = true;
            break;
        }
    }

    for (const keyword of goalKeywords) {
        if (prompt.toLowerCase().includes(keyword)) {
            hasGoal = true;
            break;
        }
    }

    for (const keyword of formatKeywords) {
        if (prompt.toLowerCase().includes(keyword)) {
            hasFormat = true;
            break;
        }
    }

    if (hasRole) {
        feedback.push({text: '提示词明确指定了角色', isNegative: false});
        score += 2;
    } else {
        feedback.push({text: '提示词未明确指定角色', isNegative: true});
    }

    if (hasGoal) {
        feedback.push({text: '提示词包含明确的目标', isNegative: false});
        score += 2;
    } else {
        feedback.push({text: '提示词未明确指定目标', isNegative: true});
    }

    if (hasFormat) {
        feedback.push({text: '提示词包含输出格式要求', isNegative: false});
        score += 2;
    } else {
        feedback.push({text: '提示词未指定输出格式', isNegative: true});
    }

    // 归一化分数到0-10
    const normalizedScore = Math.min(10, Math.round(score / 1.3));

    return {
        score: normalizedScore,
        feedback
    };
}