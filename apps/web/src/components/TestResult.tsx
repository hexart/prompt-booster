import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, AutoScrollContent, EnhancedDropdown, DraggableNotice, EnhancedTextarea } from '@prompt-booster/ui';
import { StandardModelType } from '@prompt-booster/core/model/models/config';
import { useModelStore } from '@prompt-booster/core/model/store/modelStore';
import { cleanOptimizedPrompt } from '@prompt-booster/core/prompt/utils/promptUtils';
import { usePrompt } from '@prompt-booster/core/prompt/hooks/usePrompt';
import { useMemoryStore } from '@prompt-booster/core/storage/memoryStorage';
import { createClient } from '@prompt-booster/api/factory';
import { createStreamHandler } from '@prompt-booster/api/utils/stream';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { RocketIcon, MinimizeIcon, MaximizeIcon, ArrowLeftFromLineIcon, ArrowRightFromLineIcon, ArrowDownFromLineIcon, ArrowUpFromLineIcon } from 'lucide-react';
import LoadingIcon from '@prompt-booster/ui/components/LoadingIcon';
import { useTranslation } from 'react-i18next';

export const TestResult: React.FC = () => {
  const { t } = useTranslation();
  const { originalPrompt, optimizedPrompt } = usePrompt();
  // 使用memoryStore获取所有需要的状态
  const {
    userTestPrompt,
    setUserTestPrompt,
    originalResponse,
    setOriginalResponse,
    optimizedResponse,
    setOptimizedResponse
  } = useMemoryStore();

  // 从usePromptGroup钩子中获取isProcessing状态
  const { isProcessing } = usePrompt();

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

  // 错误通知发送处理
  useEffect(() => {
    if (error) {
      // 主要错误信息
      toast.error(`${t('toast.testError')}: ${error}`, {
        duration: 5000,  // 对于多行内容，保持可见的时间更长
      });

      // 解决方案提示（在主要错误之后显示）
      setTimeout(() => {
        toast.error(
          <>
            <p className="font-medium">可能的解决方案:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>检查您的网络连接</li>
              <li>验证您的API密钥和端点配置</li>
              <li>API服务可能暂时不可用，请稍后再试</li>
            </ul>
          </>,
          { duration: 8000 }  // 让解决方案显示更长时间
        );
      }, 300);  // 短暂延迟，以确保提示信息按顺序出现
    }
  }, [error]);

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
        provider: customInterface.providerName || customInterface.id, // 使用实际的 provider 名称
        apiKey: customInterface.apiKey,
        baseUrl: customInterface.baseUrl,
        model: customInterface.model,
        endpoints: {
          chat: customInterface.endpoint || '/v1/chat/completions',
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
          chat: modelConfig.endpoint || '/v1/chat/completions',
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
            toast.success(t('toast.originalResponseCompleted'));
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
            toast.success(t('toast.enhancedResponseCompleted'));
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
    onToggleMaximize: () => void,
    isOriginal: boolean
  ) => {

    return (
      <div className="flex flex-col h-full border rounded p-4 overflow-hidden secondary-container">
        {/* 标题和扩展按钮 */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold title-secondary">{title}</h2>
          {isStreaming ? (
            <div className="ml-2">
              <LoadingIcon />
            </div>
          ) : (
            <div className='flex gap-2'>
              <button
                className="flex text-sm items-center gap-1 rounded-lg p-3 lg:px-3 lg:py-2 button-third"
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
              </button>
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
            className="p-3 border rounded-md max-h-[380px] min-h-0 md:max-h-[100vh] autoscroll-content"
            buttonText=""
            threshold={8}
            placeholder={isStreaming ? t('testResult.responding') : t('testResult.noResponseYet')}
          />
        </div>

        <div className="flex text-sm mt-2 justify-end input-charactor-counter">
          {t('promptBooster.characterCount', { count: Number(response.length) })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 用户输入区域 */}
      {!isMaximized && (
        <div className="p-4 mb-4 border rounded-lg shadow-2xs flex-none secondary-container">
          <h2 className="text-xl font-semibold mb-4 title-secondary">
            {t('testResult.title')}
          </h2>
          {/* 使用新的DraggableNotice组件 */}
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
              className='w-60 backdrop-blur-md shadow-lg rounded-lg dragable-notice-container'
            />
          )}
          {/* textarea区域 */}
          <EnhancedTextarea
            placeholder={t('testResult.inputPlaceholder')}
            value={userTestPrompt}
            onChange={(e) => setUserTestPrompt(e.target.value)}
            label={t('testResult.testInput')}
            labelClassName="input-description"
            className='input-textarea'
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
          <label className="block text-sm font-medium mb-2 whitespace-nowrap truncate input-description">
            {t('testResult.modelSelect')}
          </label>
          <EnhancedDropdown
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
        <div className="flex items-center justify-end gap-2 flex-shrink min-w-0">
          {/* Markdown按钮 */}
          <Tooltip text={`${showMarkdown ? t('testResult.disableMarkdown') : t('testResult.enableMarkdown')}`} position="top">
            <button
              type="button"
              onClick={() => setShowMarkdown(!showMarkdown)}
              className={`px-3 py-2 rounded-md h-10 flex items-center justify-center transition-colors duration-200 ${showMarkdown
                ? 'button-confirm'
                : 'button-cancel'
                }`}
              aria-pressed={showMarkdown}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="22" height="22" fill="currentColor" display="inline-block">
                <path d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7L5.5 7 4 5H2v6h2V8l1.5 1.92L7 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z"></path>
              </svg>
            </button>
          </Tooltip>
          {/* 运行对比测试按钮 */}
          <Tooltip text={t('testResult.runComparisonTest')}>
            <button
              className={`flex gap-2 items-center px-3 py-2 rounded-md h-10 min-w-[30%] truncate transition-colors duration-500 button-confirm
                                ${isTestingOriginal || isTestingOptimized
                  ? 'cursor-not-allowed opacity-50'
                  : ''
                }`}
              onClick={isTestingOriginal || isTestingOptimized ? stopStreaming : runComparisonTest}
              disabled={!isTestingOriginal && !isTestingOptimized && (
                !originalPrompt?.trim() ||
                (!optimizedPrompt?.trim() && !isProcessing) ||
                !userTestPrompt.trim() ||
                !selectedTestModelId
              )}
            >
              <RocketIcon size={16} />
              {isTestingOriginal || isTestingOptimized
                ? t('testResult.generating')
                : (retryCount > 0 ? t('testResult.retryingCount', { count: retryCount, max: maxRetries }) : t('testResult.runTest'))
              }
            </button>
          </Tooltip>
          {/* 最大化/还原按钮 */}
          <button
            className='px-3 py-2 rounded-md h-10 text-sm flex items-center gap-1 button-third'
            onClick={() => setIsMaximized(!isMaximized)}
            disabled={!originalResponse && !optimizedResponse}
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
          </button>
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