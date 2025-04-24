import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, AutoScrollContent, EnhancedDropdown, DraggableNotice, EnhancedTextarea } from '@prompt-booster/ui';
import { StandardModelType } from '@prompt-booster/core/model/models/config';
import { useModelStore } from '@prompt-booster/core/model/store/modelStore';
import { cleanOptimizedPrompt } from '@prompt-booster/core/prompt/utils/promptUtils';
import { usePromptGroup } from '@prompt-booster/core/prompt/hooks/usePrompt';
import { useMemoryStore } from '@prompt-booster/core/storage/memoryStorage';
import { createClient } from '@prompt-booster/api/factory';
import { createStreamHandler } from '@prompt-booster/api/utils/stream';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { RefreshCw, MinimizeIcon, MaximizeIcon, ArrowLeftFromLineIcon, ArrowRightFromLineIcon } from 'lucide-react';

export const TestResult: React.FC = () => {
    // 使用memoryStore获取所有需要的状态
    const {
        originalPrompt,
        optimizedPrompt,
        userTestPrompt,
        setUserTestPrompt,
        originalResponse,
        setOriginalResponse,
        optimizedResponse,
        setOptimizedResponse
    } = useMemoryStore();

    // 从usePromptGroup钩子中获取isProcessing状态
    const { isProcessing } = usePromptGroup();

    const {
        isCustomInterface,
        getCustomInterface,
        getEnabledModels,
        configs
    } = useModelStore();

    // 状态管理
    // 从 localStorage 初始化状态
    const [selectedTestModelId, setSelectedTestModelId] = useState<string>(() => {
        return localStorage.getItem('testResultModelId') || '';
    });
    const [isTestingOriginal, setIsTestingOriginal] = useState(false);
    const [isTestingOptimized, setIsTestingOptimized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isOriginalMaximized, setIsOriginalMaximized] = useState(false);
    const [isOptimizedMaximized, setIsOptimizedMaximized] = useState(false);
    const [showMarkdown, setShowMarkdown] = useState(true);
    const [showRequirements, setShowRequirements] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 2;

    // 用于持久化选择的模型 ID
    useEffect(() => {
        if (selectedTestModelId) {
            localStorage.setItem('testResultModelId', selectedTestModelId);
        }
    }, [selectedTestModelId]);

    // 清理效果
    useEffect(() => {
        return () => stopStreaming();
    }, []);

    // 使用 RAF 节流
    const updateQueue = useRef({
        original: '',
        optimized: '',
        pending: false
    });

    // 批量更新函数
    const processQueue = useCallback(() => {
        // 如果有原始响应需要更新
        if (updateQueue.current.original) {
            setOriginalResponse(prev => prev + updateQueue.current.original);
            updateQueue.current.original = '';
        }

        // 如果有优化响应需要更新
        if (updateQueue.current.optimized) {
            setOptimizedResponse(prev => prev + updateQueue.current.optimized);
            updateQueue.current.optimized = '';
        }

        // 标记为不再有待定更新
        updateQueue.current.pending = false;
    }, [setOriginalResponse, setOptimizedResponse]);

    // 使用 useCallback 包装更新函数以避免不必要的重新创建
    const appendToOriginalResponse = useCallback((chunk: string) => {
        // 添加到队列
        updateQueue.current.original += chunk;

        // 如果没有待定更新，安排一个
        if (!updateQueue.current.pending) {
            updateQueue.current.pending = true;
            requestAnimationFrame(processQueue);
        }
    }, [processQueue]);

    const appendToOptimizedResponse = useCallback((chunk: string) => {
        // 添加到队列
        updateQueue.current.optimized += chunk;

        // 如果没有待定更新，安排一个
        if (!updateQueue.current.pending) {
            updateQueue.current.pending = true;
            requestAnimationFrame(processQueue);
        }
    }, [processQueue]);

    // 重置函数
    const resetState = useCallback(() => {
        updateQueue.current = { original: '', optimized: '', pending: false };
        setOriginalResponse('');
        setOptimizedResponse('');
    }, [setOriginalResponse, setOptimizedResponse]);

    // 跟踪活动流的引用
    const originalStreamControllerRef = useRef<AbortController | null>(null);
    const optimizedStreamControllerRef = useRef<AbortController | null>(null);

    // 获取API配置
    const getClientConfig = (modelId: string) => {
        if (isCustomInterface(modelId)) {
            const customInterface = getCustomInterface(modelId);
            if (!customInterface) {
                throw new Error('没有找到自定义接口配置');
            }

            return {
                provider: 'custom',
                apiKey: customInterface.apiKey,
                baseUrl: customInterface.baseUrl,
                model: customInterface.model,
                endpoints: {
                    chat: customInterface.endpoint,
                    models: '/v1/models'
                }
            };
        } else {
            const modelConfig = configs[modelId as StandardModelType];
            return {
                provider: modelId,
                apiKey: modelConfig.apiKey,
                baseUrl: modelConfig.baseUrl,
                model: modelConfig.model,
                endpoints: {
                    chat: modelConfig.endpoint,
                    models: '/v1/models'
                }
            };
        }
    };

    // 并行运行比较测试
    const runComparisonTest = async () => {
        if (!originalPrompt?.trim() || !optimizedPrompt?.trim() || !userTestPrompt.trim() || !selectedTestModelId) {
            setError('请确保您已输入原始提示词、 增强提示词、测试输入，并选择了模型');
            return;
        }

        const cleanedOptimizedPrompt = cleanOptimizedPrompt(optimizedPrompt);

        // 重置状态
        resetState();
        setError(null);
        setRetryCount(0);
        setIsTestingOriginal(true);
        setIsTestingOptimized(true);

        try {
            // 使用selectedTestModelId模型配置进行两次测试
            const clientConfig = getClientConfig(selectedTestModelId);

            // 创建原始提示词配置
            const originalClient = createClient({
                ...clientConfig,
                // 如果需要覆盖任何特定配置
            });

            // 创建增强提示词配置
            const optimizedClient = createClient({
                ...clientConfig,
                // 如果需要覆盖任何特定配置
            });

            // 添加调试日志
            console.log('开始对比测试，使用模型:', clientConfig.model);

            // 重置状态
            setOriginalResponse('');
            setOptimizedResponse('');

            // 打印原始提示词信息
            console.log('原始提示词测试信息:');
            console.log('System prompt (前100字符):', originalPrompt.substring(0, 100));
            console.log('User prompt (前100字符):', userTestPrompt.substring(0, 100));

            // 打印增强提示词信息
            console.log('增强提示词测试信息:');
            console.log('System prompt (前100字符):', cleanedOptimizedPrompt.substring(0, 100));
            console.log('User prompt (前100字符):', userTestPrompt.substring(0, 100));

            // 并行执行两个测试
            await Promise.all([
                // 原始提示词测试
                originalClient.streamChat({
                    userMessage: userTestPrompt,
                    systemMessage: originalPrompt
                }, createStreamHandler(
                    // 确保每次都是累加内容
                    (chunk: string) => {
                        // console.log(`原始提示词收到数据: ${chunk.length}字符`);
                        appendToOriginalResponse(chunk);
                    },
                    // 错误处理
                    (error: Error) => {
                        console.error('原始提示词错误:', error);
                        setIsTestingOriginal(false);
                        setError(`原始提示词测试错误: ${error.message}`);
                    },
                    // 完成处理
                    () => {
                        setIsTestingOriginal(false);
                        toast.success('原始提示词响应已完成');
                    }
                )),

                // 增强提示词测试
                optimizedClient.streamChat({
                    userMessage: userTestPrompt,
                    systemMessage: cleanedOptimizedPrompt
                }, createStreamHandler(
                    // 同样确保累加内容
                    (chunk: string) => {
                        // console.log(`增强提示词收到数据: ${chunk.length}字符`);
                        appendToOptimizedResponse(chunk);
                    },
                    // 错误处理
                    (error: Error) => {
                        console.error('增强提示词错误:', error);
                        setIsTestingOptimized(false);
                        setError(`增强提示词测试错误: ${error.message}`);
                    },
                    // 完成处理
                    () => {
                        setIsTestingOptimized(false);
                        toast.success('增强提示词响应已完成');
                    }
                ))
            ]);

        } catch (error) {
            console.error('对比测试错误:', error);
            const errorMessage = error instanceof Error ?
                error.message :
                (typeof error === 'string' ? error : '对比测试过程中发生网络连接错误');

            setError(errorMessage);
        } finally {
            setIsTestingOriginal(false);
            setIsTestingOptimized(false);
        }
    };

    // 停止所有流式响应
    const stopStreaming = () => {
        [originalStreamControllerRef, optimizedStreamControllerRef].forEach(ref => {
            if (ref.current) {
                ref.current.abort();
                ref.current = null;
            }
        });
        setIsTestingOriginal(false);
        setIsTestingOptimized(false);
    };

    // 渲染响应区域
    const renderResponseArea = (
        title: string,
        response: string,
        isStreaming: boolean,
        isMaximized: boolean,
        onToggleMaximize: () => void
    ) => {

        return (
            <div className="flex flex-col h-full border rounded p-4 border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* 标题和复制按钮 */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-white">{title}</h2>
                    {isStreaming ? (
                        <div className="ml-2 text-blue-500 dark:text-blue-400">
                            <RefreshCw size={18} className='animate-spin' />
                        </div>
                    ) : response && (
                        <div className='flex gap-2'>
                            <button
                                className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 bg-white dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg p-3 transition-colors"
                                onClick={onToggleMaximize}
                                disabled={!response}
                            >
                                {isMaximized ? (
                                    <>
                                        {/* 大屏幕显示左右箭头 */}
                                        <span className="hidden md:inline">
                                            {title.includes("原始") ? <ArrowLeftFromLineIcon size={14} /> : <ArrowRightFromLineIcon size={14} />}
                                        </span>
                                        {/* 小屏幕显示上下箭头 */}
                                        <span className="inline md:hidden">
                                            <MinimizeIcon size={16} />
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {/* 大屏幕显示左右箭头 */}
                                        <span className="hidden md:inline">
                                            {title.includes("原始") ? <ArrowRightFromLineIcon size={14} /> : <ArrowLeftFromLineIcon size={14} />}
                                        </span>
                                        {/* 小屏幕显示上下箭头 */}
                                        <span className="inline md:hidden">
                                            <MaximizeIcon size={16} />
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
                {/* 内容区域 */}
                <div className="flex flex-col flex-grow min-h-[200px] md:min-h-0">
                    <AutoScrollContent
                        content={response}
                        streaming={isStreaming}
                        allowHtml={showMarkdown}
                        enableMarkdown={showMarkdown}
                        className="p-3 border rounded-md max-h-[380px] md:max-h-[100vh] bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-600/30 dark:border-gray-600 hover:dark:border-gray-500 dark:text-white"
                        buttonText=""
                        threshold={8}
                        placeholder={isStreaming ? "正在生成响应..." : "暂无响应内容，请运行测试..."}
                    />
                </div>

                <div className="flex text-sm text-gray-500 dark:text-gray-400 mt-2 justify-end">
                    {response.length} 字符
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 用户输入区域 */}
            {!isMaximized && (
                <div className="p-4 mb-4 border rounded-lg shadow-2xs bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex-none">
                    <h2 className="text-xl font-semibold mb-4 text-gray-600 dark:text-white">提示词对比测试</h2>
                    {/* 使用新的DraggableNotice组件 */}
                    {showRequirements && (
                        <DraggableNotice
                            items={[
                                {
                                    text: "需要输入原始提示词",
                                    isNeeded: !originalPrompt?.trim()
                                },
                                {
                                    text: "需要先增强提示词",
                                    isNeeded: !optimizedPrompt?.trim() && !isProcessing
                                },
                                {
                                    text: "需要输入测试内容",
                                    isNeeded: !userTestPrompt.trim()
                                }
                            ]}
                            onClose={() => setShowRequirements(false)}
                            className='w-56 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700'
                        />
                    )}
                    {/* textarea区域 */}
                    <EnhancedTextarea
                        placeholder="输入测试内容，它将与系统提示词组合进行测试..."
                        value={userTestPrompt}
                        onChange={(e) => setUserTestPrompt(e.target.value)}
                        label="测试输入 (用户提示词)"
                        labelClassName="text-gray-400 dark:text-gray-300"
                        rows={4}
                        showCharCount={true}
                        disabled={isTestingOriginal || isTestingOptimized}
                    />
                </div>
            )}
            {/* 控制面板 */}
            <div className="flex flex-row justify-between items-end gap-4 mb-4">
                {/* 选择模型菜单区域 */}
                <div className="min-w-[33%]">
                    <label className="block text-sm font-medium mb-2 whitespace-nowrap truncate text-gray-400 dark:text-gray-300">选择模型进行测试</label>
                    <EnhancedDropdown
                        options={getEnabledModels().map(model => ({
                            value: model.id,
                            label: model.name
                        }))}
                        value={selectedTestModelId}
                        onChange={setSelectedTestModelId}
                        placeholder="选择模型..."
                        disabled={isTestingOriginal || isTestingOptimized}
                        className=""
                    />
                </div>
                {/* 按钮区域 */}
                <div className="flex items-center justify-end gap-2 flex-shrink min-w-0">
                    {/* Markdown按钮 */}
                    <button
                        type="button"
                        onClick={() => setShowMarkdown(!showMarkdown)}
                        className={`px-3 py-2 rounded-md border h-10 flex items-center justify-center transition-colors duration-200 ${showMarkdown
                            ? 'bg-blue-500 hover:bg-blue-600 text-white hover:text-white border-blue-300 hover:border-blue-400 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-blue-200 dark:hover:text-blue-100 dark:border-blue-800 dark:hover:border-blue-900'
                            : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-500 border-gray-300 hover:border-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-500 dark:hover:text-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                            }`}
                        aria-pressed={showMarkdown}
                        title={showMarkdown ? "Markdown格式已开启" : "Markdown格式已关闭"}
                    >
                        <svg
                            width="24"
                            height="16"
                            viewBox="0 0 208 128"
                        >
                            <path
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="10"
                                d="M15,5h178c5.523,0,10,4.477,10,10v98c0,5.523-4.477,10-10,10H15c-5.523,0-10-4.477-10-10V15C5,9.477,9.477,5,15,5z"
                            />
                            <path
                                fill="currentColor"
                                d="M30,98V30h20l20,25l20-25h20v68H90V59L70,84L50,59v39H30z M155,98l-30-33h20V30h20v35h20L155,98z"
                            />
                        </svg>
                    </button>
                    {/* 运行对比测试按钮 */}
                    <Tooltip text="运行对比测试">
                        <button
                            className={`px-3 py-2 rounded-md h-10 min-w-[30%] truncate transition-colors duration-500 ${isTestingOriginal || isTestingOptimized
                                ? 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700'
                                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300 disabled:text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800 dark:disabled:text-blue-300 disabled:cursor-not-allowed'
                                }`}
                            onClick={isTestingOriginal || isTestingOptimized ? stopStreaming : runComparisonTest}
                            disabled={!isTestingOriginal && !isTestingOptimized && (
                                !originalPrompt?.trim() ||
                                (!optimizedPrompt?.trim() && !isProcessing) ||
                                !userTestPrompt.trim() ||
                                !selectedTestModelId
                            )}
                        >
                            {isTestingOriginal || isTestingOptimized
                                ? '停止生成'
                                : (retryCount > 0 ? `重试中 (${retryCount}/${maxRetries})...` : '运行测试')
                            }
                        </button>
                    </Tooltip>
                    {/* 最大化/还原按钮 */}
                    <button
                        className='px-3 py-2 rounded-md h-10 text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        onClick={() => setIsMaximized(!isMaximized)}
                        disabled={!originalResponse && !optimizedResponse}
                    >
                        {isMaximized ? (
                            <>
                                <MinimizeIcon size={14} />
                                <span className="hidden md:block">还原</span>
                            </>
                        ) : (
                            <>
                                <MaximizeIcon size={14} />
                                <span className="hidden md:block">最大化</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {/* 错误显示 */}
            {error && (
                // 此错误应该为使用toast.error发送
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-300">
                    <p className="font-medium">测试错误:</p>
                    <p>{error}</p>
                    <div className="mt-2 text-sm">
                        <p>可能的解决方案:</p>
                        <ul className="list-disc ml-5 mt-1">
                            <li>检查您的网络连接</li>
                            <li>验证您的API密钥和端点配置</li>
                            <li>API服务可能暂时不可用，请稍后再试</li>
                        </ul>
                    </div>
                </div>
            )}
            {/* 测试结果展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0 md:overflow-y-hidden">
                {/* 当优化响应最大化时，原始响应不显示 */}
                {!isOptimizedMaximized && (
                    <div className={isOriginalMaximized ? "col-span-2" : "min-h-0"}>
                        {renderResponseArea(
                            "原始提示词响应",
                            originalResponse,
                            isTestingOriginal,
                            isOriginalMaximized,
                            () => {
                                setIsOriginalMaximized(!isOriginalMaximized);
                                setIsOptimizedMaximized(false);
                            }
                        )}
                    </div>
                )}

                {/* 当原始响应最大化时，优化响应不显示 */}
                {!isOriginalMaximized && (
                    <div className={isOptimizedMaximized ? "col-span-2" : ""}>
                        {renderResponseArea(
                            "增强提示词响应",
                            optimizedResponse,
                            isTestingOptimized,
                            isOptimizedMaximized,
                            () => {
                                setIsOptimizedMaximized(!isOptimizedMaximized);
                                setIsOriginalMaximized(false);
                            }
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};