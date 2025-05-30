// packages/ui/src/components/Markdown.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTheme } from './ThemeContext';
import { Components } from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
// 如果需要支持特定语言，还可以导入语言支持
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import { visit } from 'unist-util-visit';
// 导入think标签插件
import { preprocessThinkTags, handleThinkBlocks } from './MarkdownThink';
import './markdown.css';
import './markdownthink.css'; // 引入think标签的样式

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);

// 组件属性类型定义
interface MarkdownProps {
    /** Markdown 内容 */
    content: string;
    /** 是否启用 HTML 解析 */
    allowHtml?: boolean;
    /** 是否在流式传输内容中 */
    streaming?: boolean;
    /** 自定义 CSS 类 */
    className?: string;
    /** 容器样式 */
    style?: React.CSSProperties;
}

// 闪烁光标组件
const BlinkingCursor: React.FC = () => {
    return <span className="blinking-cursor" />;
};

// 闪烁光标插件
const cursorPlugin = () => {
    return (tree: any) => {
        if (!tree || typeof tree !== 'object') return tree;

        visit(
            tree,
            'text',
            (node: any, index: number | undefined, parent: any) => {
                // 防御性检查
                if (!node || typeof node !== 'object' || !parent || index === undefined || index < 0) return;
                if (!parent.children || !Array.isArray(parent.children)) return;

                const placeholderPattern = /\u200B/g;
                // 防御性检查node.value
                if (typeof node.value !== 'string') return;

                const matches = [...node.value.matchAll(placeholderPattern)];

                if (matches.length > 0) {
                    const newNodes: any[] = [];
                    let lastIndex = 0;

                    matches.forEach((match) => {
                        const [fullMatch] = match;
                        const startIndex = match.index!;
                        const endIndex = startIndex + fullMatch.length;

                        if (startIndex > lastIndex) {
                            newNodes.push({
                                type: 'text',
                                value: node.value.slice(lastIndex, startIndex)
                            });
                        }

                        newNodes.push({
                            type: 'BlinkingCursor',
                            data: {
                                hName: 'BlinkingCursor',
                                hProperties: { whitespace: true }
                            }
                        });

                        lastIndex = endIndex;
                    });

                    if (lastIndex < node.value.length) {
                        newNodes.push({
                            type: 'text',
                            value: node.value.slice(lastIndex)
                        });
                    }

                    // 安全地替换节点
                    if (newNodes.length > 0) {
                        parent.children.splice(index, 1, ...newNodes);
                    }
                }
            }
        );

        return tree;
    };
};

/**
 * Markdown 渲染组件
 * 
 * 支持 GitHub 风格的 Markdown 和可选的 HTML 内容
 * 集成了 Think 标签处理插件
 */
export const Markdown: React.FC<MarkdownProps> = ({
    content,
    streaming = false,
    className = '',
    style = {},
}) => {
    // 使用主题上下文获取当前主题
    const { resolvedTheme } = useTheme();
    // 判断是否为暗色模式
    const isDarkMode = resolvedTheme === 'dark';
    // 创建一个ref来引用container元素
    const containerRef = useRef<HTMLDivElement>(null);
    // 处理流式内容时的光标
    const processedContent = useMemo(() => {
        // 先预处理 think 标签
        const preprocessed = preprocessThinkTags(content);

        // 再添加流式光标
        if (streaming && typeof preprocessed === 'string') {
            return preprocessed + '\u200B';
        }
        return preprocessed || '';
    }, [content, streaming]);

    // 使用 useMemo 缓存插件配置，避免不必要的重新计算
    const plugins = useMemo(() => {
        // 创建插件数组
        const remarkPlugins: any[] = [remarkGfm];

        // 最后添加光标插件（只添加一次）
        remarkPlugins.push(cursorPlugin);

        // 确保始终使用 rehypeRaw 来解析 HTML
        const rehypePlugins = [rehypeRaw];

        return {
            remarkPlugins,
            rehypePlugins,
        };
    }, [streaming]);

    // 组件渲染后，处理思考块
    useEffect(() => {
        // 处理思考块的折叠/展开状态
        handleThinkBlocks(containerRef.current, content);
    }, [content, streaming]);

    // 自定义组件配置
    const components: Components = useMemo(() => {
        return {
            // 代码块
            pre: ({ children }) => {
                // 直接返回子元素，不再生成额外的 pre 标签
                return <>{children}</>;
            },
            code: ({ node, className, children, ...props }: any) => {
                // 检查是否有语言类名
                const match = /language-(\w+)/.exec(className || '');

                // 内容检查（可选，作为备用检查）
                const content = String(children);
                const hasNewline = content.includes('\n');

                // 如果有语言标记或内容包含换行符，则视为多行代码块
                const isMultilineCode = !!match || hasNewline;

                if (isMultilineCode) {
                    if (match && match[1].toLowerCase() === 'markdown') {
                        // 对markdown代码块使用普通pre/code标签，不使用语法高亮
                        return (
                            <div className="relative mb-4 mx-4">
                                {match && (
                                    <span className="absolute top-0 right-0 z-10 px-2 py-1 text-xs font-mono rounded-bl rounded-tr markdown-code-lang-tag">
                                        {match[1]}
                                    </span>
                                )}
                                <pre
                                    className="p-4 overflow-auto rounded-md font-mono text-sm"
                                    style={{
                                        background: isDarkMode ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)'
                                    }}
                                >
                                    <code>{content}</code>
                                </pre>
                            </div>
                        );
                    }
                    return (
                        <div className="relative m-4">
                            {match && (
                                <span className="absolute top-0 right-0 z-10 px-2 py-1 text-xs font-mono rounded-bl rounded-tr markdown-code-lang-tag">
                                    {match[1]}
                                </span>
                            )}
                            <SyntaxHighlighter
                                style={isDarkMode ? vscDarkPlus : vs}
                                language={match ? match[1] : ''}
                                PreTag="div"
                                className="p-0 overflow-auto [&::-webkit-scrollbar:horizontal]:h-1 rounded-md markdown-code-block"
                                customStyle={{
                                    margin: 0,
                                    padding: '1rem',
                                    borderRadius: '0.375rem',
                                    background: isDarkMode ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)'
                                }}
                                codeTagProps={{
                                    className: 'font-mono text-sm'
                                }}
                                wrapLines={true}
                                wrapLongLines={false}
                                {...props}
                            >
                                {content.replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    );
                } else {
                    // 单行代码块
                    return (
                        <code className="px-1.5 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono" {...props}>
                            {children}
                        </code>
                    );
                }
            },

            // 段落
            p: ({ children }) => (
                <p className="mb-2 leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>
            ),

            // 标题
            h1: ({ children }) => (
                <h1 className="text-3xl font-semibold mt-6 mb-4 pb-1 border-b markdown-h1 leading-tight">
                    {children}
                </h1>
            ),
            h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-6 mb-3 pb-1 border-b markdown-h2 leading-tight">
                    {children}
                </h2>
            ),
            h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-5 mb-3 text-gray-900 dark:text-white leading-tight">
                    {children}
                </h3>
            ),
            h4: ({ children }) => (
                <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white leading-tight">
                    {children}
                </h4>
            ),

            // 列表
            ul: ({ children }) => (
                <ul className="ps-8 mt-2 mb-2 list-disc text-gray-800 dark:text-gray-200">
                    {children}
                </ul>
            ),
            ol: ({ children }) => (
                <ol className="ps-8 mt-2 mb-4 list-decimal text-gray-800 dark:text-gray-200">
                    {children}
                </ol>
            ),
            li: ({ children }) => (
                <li className="mb-1 text-gray-800 dark:text-gray-200">
                    {children}
                </li>
            ),

            // 链接
            a: ({ href, children }) => (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {children}
                </a>
            ),

            // 强调
            em: ({ children }) => (
                <em className="italic text-gray-800 dark:text-gray-200">
                    {children}
                </em>
            ),
            strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 dark:text-white">
                    {children}
                </strong>
            ),

            // 引用
            blockquote: ({ children }) => (
                <blockquote className="ps-4 pe-4 italic border-l-4 markdown-table my-4 text-gray-700 dark:text-gray-300">
                    {children}
                </blockquote>
            ),

            // 表格
            table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border markdown-table rounded-lg">
                        {children}
                    </table>
                </div>
            ),
            thead: ({ children }) => <thead className="rounded-t bg-gray-200/80 dark:bg-gray-600">{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr className="border-b markdown-table even:bg-gray-100 dark:even:bg-gray-800/40">{children}</tr>,
            th: ({ children }) => (
                <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white border-r markdown-table last:border-r-0">
                    {children}
                </th>
            ),
            td: ({ children }) => (
                <td className="px-4 py-2 text-gray-800 dark:text-gray-200 border-r markdown-table last:border-r-0">
                    {children}
                </td>
            ),

            // 水平线
            hr: () => <hr className="my-6 h-[1px] markdown-hr border-0" />,

            // 确保换行正确显示
            br: () => <br />,

            // 自定义闪烁光标组件
            'blinkingcursor': ({ node, ...props }: any) => <BlinkingCursor {...props} />
        };
    }, [isDarkMode]);

    return (
        <div
            ref={containerRef}
            className={`text-gray-800 dark:text-gray-200 font-sans leading-normal ${className}`}
            style={style}
        >
            <ReactMarkdown
                remarkPlugins={plugins.remarkPlugins}
                rehypePlugins={plugins.rehypePlugins}
                components={components}
                allowElement={() => true}
                skipHtml={false}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};