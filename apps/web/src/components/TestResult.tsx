import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast, AutoScrollContent, EnhancedDropdown, DraggableNotice, EnhancedTextarea, AnimatedButton } from '@prompt-booster/ui';
import { useModelData } from '../hooks/model-hooks';
import { cleanOptimizedPrompt, getLanguageInstruction } from '@prompt-booster/core/prompt/utils/promptUtils';
import { usePrompt } from '@prompt-booster/core/prompt/hooks/usePrompt';
import { useMemoryStore } from '@prompt-booster/core/storage/memoryStorage';
import { llmService } from '@prompt-booster/core/prompt/services/llmService';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { BookOpenCheckIcon, RocketIcon, MinimizeIcon, MaximizeIcon, ArrowLeftFromLineIcon, ArrowRightFromLineIcon, ArrowDownFromLineIcon, ArrowUpFromLineIcon } from 'lucide-react';
import LoadingIcon from '@prompt-booster/ui/components/LoadingIcon';
import { useTranslation } from 'react-i18next';
import { isRTL, getButtonPosition } from '../rtl';

export const TestResult: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { originalPrompt, optimizedPrompt, isProcessing } = usePrompt();
  // 使用memoryStore获取所有需要的状态
  const {
    userTestPrompt,
    setUserTestPrompt,
    originalResponse,
    setOriginalResponse,
    optimizedResponse,
    setOptimizedResponse
  } = useMemoryStore();

  const {
    getEnabledModels,
  } = useModelData();

  // 状态管理
  // 从 localStorage 初始化状态
  const [selectedTestModelId, setSelectedTestModelId] = useState<string>(() => {
    return localStorage.getItem('testResultModelId') || '';
  });
  const [isTestingOriginal, setIsTestingOriginal] = useState(false);
  const [isTestingOptimized, setIsTestingOptimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isOriginalMaximized, setIsOriginalMaximized] = useState(false);
  const [isOptimizedMaximized, setIsOptimizedMaximized] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [showRequirements, setShowRequirements] = useState(true);
  const [isUserCancelled, setIsUserCancelled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 定义动画配置
  const animationConfig = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  };

  // 用于持久化选择的模型 ID
  useEffect(() => {
    if (selectedTestModelId) {
      localStorage.setItem('testResultModelId', selectedTestModelId);
    }
  }, [selectedTestModelId]);

  // 清理效果
  useEffect(() => {
    return () => stopStreaming(false);
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

  // 并行运行比较测试
  const runComparisonTest = async () => {
    const cleanedOptimizedPrompt = cleanOptimizedPrompt(optimizedPrompt);

    // 重置状态
    resetState();
    setIsUserCancelled(false);
    setIsTestingOriginal(true);
    setIsTestingOptimized(true);
    // 创建新的 AbortController 实例
    originalStreamControllerRef.current = new AbortController();
    optimizedStreamControllerRef.current = new AbortController();

    // 创建 loading toast
    const originalToastId = toast.loading(t('toast.originalResponseGenerating'));
    const optimizedToastId = toast.loading(t('toast.enhancedResponseGenerating'));

    try {
      // 获取当前语言设置
      const currentLanguage = i18n.language;
      const languageInstruction = getLanguageInstruction(currentLanguage);

      // 为用户提示词添加语言指令
      const userPromptWithLang = languageInstruction
        ? `${userTestPrompt}\n\n${languageInstruction}`
        : userTestPrompt;

      // 为系统提示词添加语言指令
      const originalSystemPrompt = languageInstruction
        ? `${originalPrompt}\n\n${languageInstruction}`
        : originalPrompt;

      const optimizedSystemPrompt = languageInstruction
        ? `${cleanedOptimizedPrompt}\n\n${languageInstruction}`
        : cleanedOptimizedPrompt;

      // 调试日志
      // console.log('开始对比测试，使用模型:', selectedTestModelId);
      // console.log('原始提示词测试信息:');
      // console.log('System prompt (前50字符):', originalPrompt.substring(0, 50));
      // console.log('System prompt (后20字符):', originalSystemPrompt.slice(-20));
      // console.log('User prompt (前50字符):', userTestPrompt.substring(0, 50));
      // console.log('User prompt (后20字符):', userPromptWithLang.slice(-20));

      // 打印增强提示词信息
      // console.log('增强提示词测试信息:');
      // console.log('System prompt (前50字符):', cleanedOptimizedPrompt.substring(0, 50));
      // console.log('System prompt (后20字符):', optimizedSystemPrompt.slice(-20));

      let completedCount = 0;
      const checkAllComplete = () => {
        completedCount++;
        if (completedCount === 2) {
          console.log('🎉 对比测试全部完成');
          toast.success(t('toast.comparisonTestAllCompleted'));
        }
      };

      // 调用服务层的对比测试方法
      await llmService.runComparisonTest({
        userMessage: userPromptWithLang,
        originalSystemMessage: originalSystemPrompt,
        optimizedSystemMessage: optimizedSystemPrompt,
        modelId: selectedTestModelId,
        onOriginalData: appendToOriginalResponse,
        onOptimizedData: appendToOptimizedResponse,
        onOriginalComplete: () => {
          setIsTestingOriginal(false);
          toast.success(t('toast.originalResponseCompleted'), { id: originalToastId });
          checkAllComplete();
        },
        onOptimizedComplete: () => {
          setIsTestingOptimized(false);
          toast.success(t('toast.enhancedResponseCompleted'), { id: optimizedToastId });
          checkAllComplete();
        },
        onOriginalError: (error: Error) => {
          if (error.name === 'AbortError' || isUserCancelled) {
            toast.dismiss(originalToastId);
            return;
          }
          console.error('原始提示词测试错误:', error);
          setIsTestingOriginal(false);
          toast.error(`${t('toast.originalResponseFailed')}: ${error.message}`, { id: originalToastId });
        },
        onOptimizedError: (error: Error) => {
          if (error.name === 'AbortError' || isUserCancelled) {
            toast.dismiss(optimizedToastId);
            return;
          }
          console.error('增强提示词测试错误:', error);
          setIsTestingOptimized(false);
          toast.error(`${t('toast.enhancedResponseFailed')}: ${error.message}`, { id: optimizedToastId });
        },
        originalAbortController: originalStreamControllerRef.current || undefined,
        optimizedAbortController: optimizedStreamControllerRef.current || undefined
      });
    } catch (error) {
      console.error(`${t('toast.testError')}:`, error);
      setIsTestingOriginal(false);
      setIsTestingOptimized(false);
      // 更新两个 toast 为错误状态
      toast.error(t('toast.testError'), { id: originalToastId });
      toast.error(t('toast.testError'), { id: optimizedToastId });
    }
  };

  // 停止所有流式响应
  const stopStreaming = useCallback((showToast: boolean = true) => {
    const hasActiveStream = originalStreamControllerRef.current || optimizedStreamControllerRef.current;

    setIsUserCancelled(true);
    [originalStreamControllerRef, optimizedStreamControllerRef].forEach(ref => {
      if (ref.current) {
        ref.current.abort();
        ref.current = null;
      }
    });
    setIsTestingOriginal(false);
    setIsTestingOptimized(false);

    // 只在有活动流且需要显示 toast 时才显示
    if (hasActiveStream && showToast) {
      toast.info(t('toast.generationStopped'));
    }
  }, [t]);

  // 清理效果
  useEffect(() => {
    return () => stopStreaming(false);
  }, [stopStreaming]);

  // 渲染响应区域
  const renderResponseArea = (
    title: string,
    response: string,
    isStreaming: boolean,
    isMaximized: boolean,
    onToggleMaximize: () => void,
    isOriginal: boolean
  ) => {

    return (
      <div className="flex flex-col h-full border rounded-xl p-4 overflow-hidden secondary-container">
        {/* 标题和扩展按钮 */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold title-secondary">{title}</h2>
          {isStreaming ? (
            <div className="ms-2">
              <LoadingIcon />
            </div>
          ) : (
            <div className='flex gap-2'>
              <AnimatedButton
                className="flex text-sm items-center gap-1 p-3 lg:px-3 lg:py-2 button-third"
                onClick={onToggleMaximize}
                disabled={!response}
              >
                {isMaximized ? (
                  <>
                    <div className="hidden md:flex">
                      {isOriginal ? <ArrowLeftFromLineIcon size={16} /> : <ArrowRightFromLineIcon size={16} />}
                    </div>
                    <div className="flex md:hidden">
                      {isOriginal ? <ArrowUpFromLineIcon size={16} /> : <ArrowDownFromLineIcon size={16} />}
                    </div>
                    <span className="hidden lg:inline">
                      {t('common.buttons.collapse')}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="hidden md:flex">
                      {isOriginal ? <ArrowRightFromLineIcon size={16} /> : <ArrowLeftFromLineIcon size={16} />}
                    </div>
                    <div className="flex md:hidden">
                      {isOriginal ? <ArrowDownFromLineIcon size={16} /> : <ArrowUpFromLineIcon size={16} />}
                    </div>
                    <span className="hidden lg:inline">
                      {t('common.buttons.expand')}
                    </span>
                  </>
                )}
              </AnimatedButton>
            </div>
          )}
        </div>
        {/* 内容区域 */}
        <div className={"flex flex-col flex-grow min-h-[200px] md:min-h-0" + (isMaximized ? " max-h-[100vh]" : "")}>
          <AutoScrollContent
            content={response}
            streaming={isStreaming}
            allowHtml={showMarkdown}
            enableMarkdown={showMarkdown}
            className="p-3 border rounded-lg max-h-[380px] min-h-0 md:max-h-[100vh] autoscroll-content"
            buttonText=""
            threshold={8}
            placeholder={isStreaming ? t('testResult.responding') : t('testResult.noResponseYet')}
            buttonPosition={getButtonPosition('top-right')}
            isRTL={isRTL()}
            isCancelled={isUserCancelled}
          />
        </div>

        <div className="flex text-sm mt-2 justify-end input-charactor-counter">
          {t('promptBooster.characterCount', { count: Number(response.length) })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 用户输入区域 */}
      <motion.div
        animate={{
          height: isMaximized ? 0 : "auto",
          opacity: isMaximized ? 0 : 1,
        }}
        transition={{
          duration: animationConfig.duration,
          ease: animationConfig.ease,
        }}
      >
        <div id="parent-container" className="relative p-4 border rounded-xl shadow-2xs secondary-container">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold mb-4 title-secondary">
            <BookOpenCheckIcon size={20} />
            {t('testResult.title')}
          </h2>
          {/* 使用DraggableNotice组件 */}
          {showRequirements && (
            <DraggableNotice
              title={t('testResult.notice.title')}
              items={[
                {
                  text: t('testResult.notice.text1'),
                  isNeeded: !originalPrompt?.trim()
                },
                {
                  text: t('testResult.notice.text2'),
                  isNeeded: !optimizedPrompt?.trim() && !isProcessing
                },
                {
                  text: t('testResult.notice.text3'),
                  isNeeded: !userTestPrompt.trim()
                }
              ]}
              onClose={() => setShowRequirements(false)}
              constraintsId="parent-container"
              className='backdrop-blur-md shadow-lg rounded-2xl dragable-notice-container'
              isRTL={isRTL()}
              initialPosition={{ x: '20px', y: '20px' }}
            />
          )}
          {/* textarea区域 */}
          <EnhancedTextarea
            id="test-input"
            placeholder={t('testResult.inputPlaceholder')}
            value={userTestPrompt}
            onChange={(e) => setUserTestPrompt(e.target.value)}
            label={t('testResult.testInput')}
            labelClassName="input-description"
            className='input-textarea'
            rows={4}
            showCharCount={true}
            disabled={isTestingOriginal || isTestingOptimized}
            buttonPosition={getButtonPosition('top-right')}
            filename={t('testResult.title')}
            showDownloadDocx={false}
          />
        </div>
      </motion.div>
      {/* 控制面板 */}
      <div className="flex flex-row justify-between items-end gap-4">
        {/* 选择模型菜单区域 */}
        <div className="min-w-[33%]">
          <label className="block text-sm font-medium mb-2 whitespace-nowrap truncate input-description" htmlFor='model-select'>
            {t('testResult.modelSelect')}
          </label>
          <EnhancedDropdown
            id="model-select"
            options={getEnabledModels().map(model => ({
              value: model.id,
              label: model.name
            }))}
            value={selectedTestModelId}
            onChange={setSelectedTestModelId}
            placeholder={t('promptBooster.modelPlaceholder')}
            disabled={isTestingOriginal || isTestingOptimized}
            className=""
          />
        </div>
        {/* 按钮区域 */}
        <div className="flex items-center justify-end gap-2 flex-shrink min-w-0 z-10">
          {/* Markdown按钮 */}
          <Tooltip text={`${showMarkdown ? t('testResult.disableMarkdown') : t('testResult.enableMarkdown')}`} position="top">
            <AnimatedButton
              type="button"
              onClick={() => setShowMarkdown(!showMarkdown)}
              className={`px-3 py-2 h-10 flex items-center justify-center transition-colors duration-200 ${showMarkdown
                ? 'button-confirm'
                : 'button-cancel'
                }`}
              aria-pressed={showMarkdown}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="22" height="22" fill="currentColor" display="inline-block">
                <path d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7L5.5 7 4 5H2v6h2V8l1.5 1.92L7 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z"></path>
              </svg>
            </AnimatedButton>
          </Tooltip>
          {/* 运行对比测试按钮 */}
          <Tooltip text={
            isTestingOriginal || isTestingOptimized
              ? t('testResult.stopGenerating')
              : t('testResult.runComparisonTest')
          }>
            <AnimatedButton
              className={`flex gap-2 items-center px-3 py-2 h-10 min-w-[30%] truncate transition-colors duration-500 ${isTestingOriginal || isTestingOptimized ? 'button-danger' : 'button-confirm'
                }`}
              onClick={() => {
                if (isTestingOriginal || isTestingOptimized) {
                  stopStreaming();
                } else {
                  runComparisonTest();
                }
              }}
              disabled={
                !isTestingOriginal && !isTestingOptimized && (
                  !originalPrompt?.trim() ||
                  (!optimizedPrompt?.trim() && !isProcessing) ||
                  !userTestPrompt.trim() ||
                  !selectedTestModelId
                )
              }
            >
              <RocketIcon size={16} />
              {isTestingOriginal || isTestingOptimized
                ? t('testResult.stopGenerating')
                : t('testResult.runTest')
              }
            </AnimatedButton>
          </Tooltip>
          {/* 最大化/还原按钮 */}
          <AnimatedButton
            className='px-3 py-2 h-10 text-sm flex items-center gap-1 button-third'
            onClick={() => {
              setIsAnimating(true);
              setIsMaximized(!isMaximized);
              // 动画结束后重置状态
              setTimeout(() => {
                setIsAnimating(false);
              }, animationConfig.duration * 1000);
            }}
            disabled={(!originalResponse && !optimizedResponse) || isAnimating}
          >
            {isMaximized ? (
              <>
                <MinimizeIcon size={14} />
                <span className="hidden md:block">{t('common.buttons.restore')}</span>
              </>
            ) : (
              <>
                <MaximizeIcon size={14} />
                <span className="hidden md:block">{t('common.buttons.maximize')}</span>
              </>
            )}
          </AnimatedButton>
        </div>
      </div>

      {/* 测试结果展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0 md:overflow-y-hidden">
        {/* 当优化响应最大化时，原始响应不显示 */}
        {!isOptimizedMaximized && (
          <div className={isOriginalMaximized ? "col-span-2 min-h-0" : "min-h-0"}>
            {renderResponseArea(
              t('testResult.originalResponse'),
              originalResponse,
              isTestingOriginal,
              isOriginalMaximized,
              () => {
                setIsOriginalMaximized(!isOriginalMaximized);
                setIsOptimizedMaximized(false);
              },
              true
            )}
          </div>
        )}

        {/* 当原始响应最大化时，优化响应不显示 */}
        {!isOriginalMaximized && (
          <div className={isOptimizedMaximized ? "col-span-2 min-h-0" : "min-h-0"}>
            {renderResponseArea(
              t('testResult.enhancedResponse'),
              optimizedResponse,
              isTestingOptimized,
              isOptimizedMaximized,
              () => {
                setIsOptimizedMaximized(!isOptimizedMaximized);
                setIsOriginalMaximized(false);
              },
              false
            )}
          </div>
        )}
      </div>
    </div>
  );
};