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
 * @param isRTL - 是否为RTL语言
 * @param t - i18next翻译函数
 * @returns 处理后的包含HTML details元素的内容字符串
 */
export const preprocessThinkTags = (
  rawContent: string,
  isRTL: boolean = false,
  t: (key: string) => string,
  isCancelled: boolean = false
): string => {
  if (!rawContent) return '';

  let processedContent = rawContent;

  // 使用SVG图标，RTL时使用相反的方向
  const arrowSvg = `<svg class="think-icon ${isRTL ? 'think-arrow-rtl' : ''}"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>`;

  // 处理已完成的思考块 (完整的<think></think>对)
  const completedTitle = t('testResult.markDown.thinkProcessCompleted');
  processedContent = processedContent.replace(
    /<think>([\s\S]*?)<\/think>/g,
    `<details class="think-block" data-complete="true"><summary class="think-header"><span>${arrowSvg}</span><span class="think-title">${completedTitle}</span></summary><div class="think-content">$1</div></details>`
  );

  // 处理未完成的思考块 (只有开始标签)
  const lastThinkIndex = processedContent.lastIndexOf('<think>');
  const lastThinkEndIndex = processedContent.lastIndexOf('</think>');

  if (lastThinkIndex > lastThinkEndIndex) {
    // 有未闭合的<think>标签，提取内容并替换
    const thinkContent = processedContent.substring(lastThinkIndex + 7); // +7 跳过 <think> 标签
    const inProgressTitle = t('testResult.markDown.thinkProcessInProgress');
    const progressClass = isCancelled ? '' : 'in-progress';

    // 替换最后一个未闭合的<think>标签及其内容
    processedContent = processedContent.substring(0, lastThinkIndex) +
      `<details class="think-block" open data-streaming="true">
        <summary class="think-header">
          <span>${arrowSvg}</span>
          <span class="think-title ${progressClass}">${inProgressTitle}</span>
        </summary>
        <div class="think-content">` +
      thinkContent +
      '</div></details>';
  }

  return processedContent;
};

/**
 * 添加思考块DOM处理函数
 * 此函数在Markdown渲染后调用，处理完成的思考块
 * 
 * @param containerElement - 包含思考块的DOM容器元素
 * @param content - 原始内容字符串
 * @param t - i18next翻译函数
 */
export const handleThinkBlocks = (
  containerElement: HTMLElement | null,
  content: string,
  t: (key: string) => string
) => {
  if (!containerElement) return;

  // 检查是否有正在流式传输的 think 块
  const streamingBlocks = containerElement.querySelectorAll('details.think-block[data-streaming="true"]');

  // 检查原始内容中是否有未闭合的<think>
  const lastThinkIndex = content.lastIndexOf('<think>');
  const lastThinkEndIndex = content.lastIndexOf('</think>');
  const hasUnclosedThink = lastThinkIndex > lastThinkEndIndex;

  // 如果不再有未闭合的<think>标签，关闭所有流式块
  if (!hasUnclosedThink && streamingBlocks && streamingBlocks.length > 0) {
    const completedTitle = t('testResult.markDown.thinkProcessCompleted');

    setTimeout(() => {
      streamingBlocks.forEach(block => {
        // 标记为已完成
        block.removeAttribute('data-streaming');
        // 移除 open 属性以关闭折叠
        block.removeAttribute('open');

        // 更新标题
        const title = block.querySelector('.think-title');
        if (title) {
          title.textContent = completedTitle;
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