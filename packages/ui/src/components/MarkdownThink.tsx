// packages/ui/src/components/MarkdownThink.tsx
/**
 * 预处理Markdown内容中的思考标签(<think>)
 * 将<think>标签转换为可折叠的HTML details元素
 * 
 * 功能:
 * 1. 处理已完成的思考块(完整的<think></think>对)
 * 2. 处理进行中的思考块(仅有开始<think>标签)
 * 3. 将思考块内容包装在代码块中(```),以保护内部非标准标签
 * 
 * @param rawContent - 原始Markdown内容字符串
 * @returns 处理后的包含HTML details元素的内容字符串
 */
export const preprocessThinkTags = (rawContent: string): string => {
    if (!rawContent) return '';
    
    let processedContent = rawContent;
    
    // 处理已完成的思考块 (完整的<think></think>对)
    processedContent = processedContent.replace(
        /<think>([\s\S]*?)<\/think>/g,
        '<details class="think-block" data-complete="true"><summary class="think-header"><span class="think-icon">►</span><span class="think-title">思考过程 (已完成)</span></summary><div class="think-content">$1</div></details>'
    );
    
    // 处理未完成的思考块 (只有开始标签)
    const lastThinkIndex = processedContent.lastIndexOf('<think>');
    const lastThinkEndIndex = processedContent.lastIndexOf('</think>');
    
    if (lastThinkIndex > lastThinkEndIndex) {
        // 有未闭合的<think>标签，提取内容并替换
        const thinkContent = processedContent.substring(lastThinkIndex + 7); // +7 跳过 <think> 标签
        
        // 替换最后一个未闭合的<think>标签及其内容
        // 注意：我们使用 ► 作为基本箭头，CSS 会在 open 状态下旋转它
        processedContent = processedContent.substring(0, lastThinkIndex) + 
            '<details class="think-block" open data-streaming="true"><summary class="think-header"><span class="think-icon">►</span><span class="think-title in-progress">思考过程 (进行中...)</span></summary><div class="think-content">' + 
            thinkContent + 
            '</div></details>';
    }
    
    return processedContent;
};

/**
 * 添加思考块DOM处理函数
 * 此函数在Markdown渲染后调用，处理完成的思考块
 */
export const handleThinkBlocks = (containerElement: HTMLElement | null, content: string) => {
    if (!containerElement) return;
    
    // 检查是否有正在流式传输的 think 块
    const streamingBlocks = containerElement.querySelectorAll('details.think-block[data-streaming="true"]');
    
    // 检查原始内容中是否有未闭合的<think>
    const lastThinkIndex = content.lastIndexOf('<think>');
    const lastThinkEndIndex = content.lastIndexOf('</think>');
    const hasUnclosedThink = lastThinkIndex > lastThinkEndIndex;
    
    // 如果不再有未闭合的<think>标签，关闭所有流式块
    if (!hasUnclosedThink && streamingBlocks && streamingBlocks.length > 0) {
        setTimeout(() => {
            streamingBlocks.forEach(block => {
                // 标记为已完成
                block.removeAttribute('data-streaming');
                // 移除 open 属性以关闭折叠
                block.removeAttribute('open');
                
                // 更新标题
                const title = block.querySelector('.think-title');
                if (title) {
                    title.textContent = '思考过程 (已完成)';
                    title.classList.remove('in-progress');
                }
            });
        }, 500); // 短暂延迟以便用户注意到变化
    }
    
    // 添加事件处理器
    addThinkBlocksEventHandlers(containerElement);
};

/**
 * 为思考块元素添加事件处理器
 * 为所有思考块(details.think-block)添加toggle事件监听器
 * 防止重复添加事件监听器
 * 
 * @param containerElement - 包含思考块的DOM容器元素
 */
export const addThinkBlocksEventHandlers = (containerElement: HTMLElement | null) => {
    if (!containerElement) return;

    const details = containerElement.querySelectorAll('details.think-block');
    details.forEach(detail => {
        // 检查是否已经添加了事件监听器
        if (!(detail as any)._hasClickListener) {
            detail.addEventListener('toggle', () => {
                // 不需要手动更新图标，CSS 会自动处理
            });
            (detail as any)._hasClickListener = true;
        }
    });
};