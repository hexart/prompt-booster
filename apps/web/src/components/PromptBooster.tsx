import React, { useState, useEffect, useRef } from 'react';
import { useMemoryStore } from '@prompt-booster/core/storage/memoryStorage';
import { promptGroupService } from '@prompt-booster/core/prompt/services/promptService';
import templates from '@prompt-booster/core/prompt/templates/default-templates.json';
import { Template } from '@prompt-booster/core/prompt/models/template';
import { analyzePromptQuality } from '@prompt-booster/core/prompt/utils/promptUtils';
import { toast, AutoScrollTextarea, EnhancedDropdown } from '@prompt-booster/ui';
import { EnhancedTextarea } from '@prompt-booster/ui';
import { ListRestartIcon, StepForwardIcon, ChartBarIcon, CopyIcon, RefreshCwIcon, CopyPlusIcon, MinimizeIcon, MaximizeIcon } from 'lucide-react';
import { Drawer } from 'vaul';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { IterationDialog } from './IterationDialog';
import { usePromptGroup } from '@prompt-booster/core/prompt/hooks/usePrompt';
import { useModelStore } from '@prompt-booster/core/model/store/modelStore';
import { PromptVersion } from '@prompt-booster/core/prompt/models/prompt';

export const PromptBooster: React.FC = () => {
    // 使用提示词组钩子
    const {
        activeGroup,
        activeVersionNumber,
        isProcessing,
        error,
        getGroupVersions,
        switchVersion,
        enhancePrompt,
        iteratePrompt,
        resetSession
    } = usePromptGroup();

    // 使用MemoryStore管理显示状态
    const {
        originalPrompt = '',
        setOriginalPrompt,
        optimizedPrompt,
        setOptimizedPrompt,
    } = useMemoryStore();

    // 选择的模板和模型
    const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
        return localStorage.getItem('selectedTemplateId') || 'general-optimize';
    });

    // 获取模型商店
    const {
        activeModel,
        setActiveModel,
        getEnabledModels
    } = useModelStore();

    // 迭代对话框状态
    const [isIterationDialogOpen, setIsIterationDialogOpen] = useState(false);

    // 分析结果状态
    const [analysisResult, setAnalysisResult] = useState<{
        score: number;
        feedback: Array<{ text: string; isNegative: boolean }>;
    } | null>(null);

    // 分析抽屉状态
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);


    // 保存模板选择到localStorage
    useEffect(() => {
        if (selectedTemplateId) {
            localStorage.setItem('selectedTemplateId', selectedTemplateId);
        }
    }, [selectedTemplateId]);

    // 处理原始提示词输入
    const handleOriginalPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setOriginalPrompt(e.target.value);
    };

    // 1. 在组件顶部添加状态和refs
    const [editablePrompt, setEditablePrompt] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    const versionsContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // 只在activeGroup存在时执行
        if (!activeGroup) return;

        // 获取当前组的版本数量
        const versionsCount = getGroupVersions(activeGroup.id).length;

        // 只有当容器存在并且版本数量大于0时才滚动
        if (versionsContainerRef.current && versionsCount > 0) {
            // 将滚动位置设置到最右边
            versionsContainerRef.current.scrollLeft = versionsContainerRef.current.scrollWidth;
        }
    }, [
        // 依赖数组：当以下值变化时触发效果
        activeGroup?.id, // 当组ID变化时重新计算
        getGroupVersions(activeGroup?.id || '').length // 当版本数量变化时（新增版本）
    ]);


    // 3. 添加一个useEffect监听流式响应结束
    useEffect(() => {
        if (!optimizedPrompt) {
            // 当 optimizedPrompt 为空时重置状态
            setEditablePrompt('');
            setIsEditMode(false);
        } else if (isProcessing) {
            // 当正在处理时，实时更新 editablePrompt 但不启用编辑模式
            setEditablePrompt(optimizedPrompt);
            setIsEditMode(false);
        } else if (!isProcessing && optimizedPrompt) {
            // 当响应结束且有内容时启用编辑模式
            setEditablePrompt(optimizedPrompt);
            setIsEditMode(true);
        }
    }, [optimizedPrompt, isProcessing]);

    // 4. 修改处理函数，只更新本地状态
    const handleOptimizedPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setEditablePrompt(newValue);
    };

    // 处理优化操作
    const handleOptimize = async () => {
        if (!originalPrompt || !originalPrompt.trim() || !activeModel) {
            return;
        }

        try {
            // 获取模型名称
            const activeModelInfo = getEnabledModels().find(model => model.id === activeModel);
            const modelName = activeModelInfo?.name || activeModel;

            toast.info(`正在使用${modelName}模型增强提示词，请稍候...`);

            // 执行优化
            await enhancePrompt({
                originalPrompt,
                templateId: selectedTemplateId,
                modelId: activeModel
            });

            toast.success('增强提示词成功');
        } catch (error) {
            console.error('增强过程中出错:', error);
            let errorMessage = '增强提示词时出错';

            if (error instanceof Error) {
                if (error.message.includes('Load failed') || error.message.includes('network')) {
                    errorMessage = `无法连接到${activeModel}模型服务，请检查：
                    1. 模型服务是否已启动
                    2. API地址与端点是否正确
                    3. 网络连接是否正常`;
                } else {
                    errorMessage = `错误: ${error.message}`;
                }
            }

            toast.error(errorMessage);
        }
    };

    // 处理用户手动保存到新版本
    const handleSaveUserModification = async () => {
        try {
            // 先同步到全局状态
            setOptimizedPrompt(editablePrompt);

            if (!activeGroup) {
                console.error("没有活动的提示词组");
                return;
            }

            // 调用service方法保存为新版本
            await promptGroupService.saveUserModification(
                activeGroup.id,
                editablePrompt
            );

            toast.success('已保存您的修改为新版本');
        } catch (error) {
            console.error('保存失败:', error);
            toast.error('保存修改失败');
        }
    };

    // 处理分析操作
    const handleAnalyze = () => {
        if (!optimizedPrompt || !optimizedPrompt.trim()) {
            return;
        }

        const result = analyzePromptQuality(optimizedPrompt);
        setAnalysisResult(result);
        setIsDrawerOpen(true);
    };

    // 处理迭代对话框提交
    const handleIterationSubmit = async (templateId: string, direction: string) => {
        if (!activeGroup) return;

        try {
            await iteratePrompt({
                groupId: activeGroup.id,
                direction,
                templateId,
                modelId: activeModel
            });

            setIsIterationDialogOpen(false);
        } catch (error) {
            console.error('迭代失败:', error);
            toast.error('迭代过程中出错');
        }
    };

    // 处理清空并重新开始
    const handleReset = () => {
        resetSession();
        setOriginalPrompt('');
        setOptimizedPrompt('');

        // 重置本地编辑状态
        setEditablePrompt('');
        setIsEditMode(false);

        // 使用useMemoryStore的clearAll方法重置
        useMemoryStore.getState().clearAll();

        toast.info('已重置工作区');
    };

    // 计算字符差异
    const calculateCharDiff = () => {
        const diff = optimizedPrompt.length - (originalPrompt?.length || 0);
        return `${diff > 0 ? '+' : ''}${diff}`;
    };

    // 最大化状态声明
    const [isMaximized, setIsMaximized] = useState(false);

    return (
        <div className="grid-cols-1 gap-6 md:min-h-[550px] flex flex-col flex-grow">
            {/* 原始提示词区域 */}
            {!isMaximized && (
                <div className="p-4 border rounded-lg shadow-2xs bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex-none">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-600 dark:text-white">原始提示词</h2>
                        {activeGroup && (
                            <Tooltip text="清空并重新开始">
                                <button
                                    className="px-3 py-2 text-sm flex items-center gap-1 rounded-md text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
                                    onClick={handleReset}
                                >
                                    <ListRestartIcon size={18} />
                                    <span className="hidden sm:block">重置</span>
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    <EnhancedTextarea
                        // className=" text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        value={originalPrompt || ''}
                        onChange={handleOriginalPromptChange}
                        placeholder="请输入您的提示词..."
                        rows={5}
                        showCharCount={true}
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-xs flex justify-between items-center dark:bg-red-900 dark:text-red-300">
                            <span>{error}</span>
                            <button
                                onClick={() => {/* 清除错误的逻辑 */ }}
                                className="text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 控制栏 */}
            <div className="flex items-end gap-3">
                <div className="min-w-[26%] inline-block">
                    <label className="block text-sm font-medium mb-2 whitespace-nowrap truncate text-gray-400 dark:text-gray-300">系统提示词模板</label>
                    <EnhancedDropdown
                        options={Object.entries(templates as Record<string, Template>)
                            .filter(([_, template]) => template.metadata?.templateType === 'optimize')
                            .map(([id, template]) => ({
                                value: id,
                                label: template.name
                            }))}
                        value={selectedTemplateId}
                        onChange={setSelectedTemplateId}
                        placeholder="选择系统提示词模板..."
                    />
                </div>

                <div className="min-w-[33%] grow">
                    <label className="block text-sm font-medium mb-2 text-gray-400 dark:text-gray-300">模型选择</label>
                    <EnhancedDropdown
                        options={getEnabledModels().map(model => ({
                            value: model.id,
                            label: model.name
                        }))}
                        value={activeModel}
                        onChange={setActiveModel}
                        placeholder="选择模型..."
                        disabled={isProcessing}
                    />
                </div>

                <Tooltip text="增强提示词">
                    <button
                        className="h-10 px-4 py-2 rounded-md truncate transition-colors bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800 dark:disabled:text-blue-200"
                        onClick={handleOptimize}
                        disabled={isProcessing || !originalPrompt || !originalPrompt.trim() || !activeModel}
                    >
                        {isProcessing ? '增强中...' : '开始增强'}
                    </button>
                </Tooltip>
            </div>

            {/* 增强提示词区域 */}
            <div
                className={`flex flex-col flex-grow md:min-h-0 p-4 border rounded-lg shadow-2xs bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700
                    ${isMaximized ? "min-h-[calc(100vh-260px)]" : "min-h-[calc(100vh-550px)]"
                    }`}>
                <div className="flex w-full mb-4 gap-2">{/* 父容器 */}
                    <div className="flex-shrink  md:w-fit min-w-[95px] max-w-[150px]">
                        <h2 className="text-xl font-semibold truncate text-gray-600 dark:text-white">
                            增强提示词
                        </h2>
                    </div>
                    {/* 版本切换标签 */}
                    <div className="flex-grow flex-shrink min-w-0 overflow-hidden [&::-webkit-scrollbar]:h-1 scrollbar-thin">
                        {activeGroup && (
                            <div ref={versionsContainerRef} className="flex items-center gap-2 pr-2 overflow-x-auto no-scrollbar w-full py-1 [&::-webkit-scrollbar]:h-1">
                                {getGroupVersions(activeGroup.id).map((version: PromptVersion) => (
                                    <button
                                        key={version.id}
                                        onClick={() => {
                                            switchVersion(activeGroup.id, version.number);
                                            setIsEditMode(false);
                                        }}
                                        className={`flex-none px-2 py-1 text-xs rounded-full min-w-[32px] ${version.number === activeVersionNumber
                                            ? 'bg-blue-500 text-white dark:bg-blue-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                            }`}
                                    >
                                        v{version.number}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 处理中指示器 */}
                    {isProcessing && (
                        <div className="flex-shrink-0 flex items-center text-blue-500 dark:text-blue-400">
                            <RefreshCwIcon size={18} className='animate-spin' />
                        </div>
                    )}

                    {/* 按钮区域 */}
                    <div className="flex-shrink-0 flex gap-2">
                        <button
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setIsIterationDialogOpen(true)}
                            disabled={!optimizedPrompt || isProcessing || !activeGroup}
                        >
                            <StepForwardIcon size={14} />
                            <span className="hidden md:block">继续迭代</span>
                        </button>

                        <button
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleAnalyze}
                            disabled={!optimizedPrompt || isProcessing || !activeGroup}
                        >
                            <ChartBarIcon size={14} />
                            <span className="hidden md:block">分析提示词</span>
                        </button>

                        <button
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                                navigator.clipboard.writeText(optimizedPrompt)
                                    .then(() => toast.success('已复制增强提示词'))
                                    .catch(err => {
                                        console.error('复制失败:', err);
                                        toast.error('复制失败，请手动复制');
                                    });
                            }}
                            disabled={!optimizedPrompt || isProcessing || !activeGroup}
                        >
                            <CopyIcon size={14} />
                            <span className="hidden md:block">复制</span>
                        </button>
                        <button
                            className='text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
                            onClick={() => setIsMaximized(!isMaximized)}
                            disabled={!optimizedPrompt || !activeGroup}
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

                {/* 增强提示词文本域 */}
                <div className="relative flex-grow flex flex-col">
                    <AutoScrollTextarea
                        className={`flex-grow p-3 border rounded-md border-gray-200 dark:border-gray-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${!optimizedPrompt && !isProcessing
                            ? "flex justify-center items-center text-center bg-gray-50  text-gray-600 dark:bg-gray-600/30 dark:text-gray-400"
                            : "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-white"
                            }`}
                        value={isEditMode ? editablePrompt : optimizedPrompt}
                        onChange={handleOptimizedPromptChange}
                        placeholder={isProcessing ? "正在增强中..." : "优化后的提示词将在这里显示"}
                        readOnly={isProcessing || !isEditMode}
                        streaming={isProcessing}
                        buttonText=""
                        centerPlaceholder={!isProcessing && !optimizedPrompt}
                    />
                    {isEditMode && editablePrompt !== optimizedPrompt && !isProcessing && (
                        <button
                            onClick={handleSaveUserModification}
                            className="absolute mt-40 bottom-4 right-4 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md shadow-sm flex items-center gap-1 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
                        >
                            <CopyPlusIcon size={14} />
                            保存为新版本
                        </button>
                    )}
                </div>

                {/* 分析结果抽屉 */}
                <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-xs" />
                        <Drawer.Content className="bg-white dark:bg-gray-800 flex flex-col rounded-t-lg fixed bottom-0 left-0 right-0 max-h-[85vh] z-50">
                            <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-t-lg border-t dark:border-gray-700 shadow-lg">
                                <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 mb-4" />

                                <div className="w-[400px] mx-auto">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center">
                                            <Drawer.Title className="text-lg font-semibold dark:text-white">增强提示词分析</Drawer.Title>
                                            {analysisResult && (
                                                <span className="text-xl font-bold dark:text-white">{analysisResult.score}/10</span>
                                            )}
                                        </div>
                                        <Drawer.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            查看您的提示词质量评分和改进建议
                                        </Drawer.Description>
                                    </div>

                                    {analysisResult && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
                                            <ul className="list-disc pl-5 text-blue-800 dark:text-blue-200">
                                                {analysisResult.feedback.map((item, index) => (
                                                    <li
                                                        key={index}
                                                        className={item.isNegative ? "text-red-600 font-medium dark:text-red-400 mb-2" : "mb-2"}
                                                    >
                                                        {item.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>

                {/* 字符数差异 */}
                <div className="mt-2 flex justify-end">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        改进: {calculateCharDiff()} 字符
                    </div>
                </div>
            </div>

            {/* 迭代对话框 */}
            <IterationDialog
                isOpen={isIterationDialogOpen}
                onClose={() => setIsIterationDialogOpen(false)}
                onSubmit={handleIterationSubmit}
                templates={templates as unknown as Record<string, Template>}
            />
        </div>
    );
};