import React, { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';
import { promptService } from "~/core/prompt/services/promptService";
import { usePromptTemplates } from "~/hooks";
import {
  analyzePromptWithLLM,
  PromptAnalysisResult,
} from "~/core/prompt/utils/promptUtils";
import { analyzePromptQuality } from "~/core/prompt/utils/promptAnalysisUtils";
import {
  toast,
  EnhancedTextarea,
  AutoScrollTextarea,
  EnhancedDropdown,
  Dialog,
  AnimatedButton,
} from "./ui";
import LoadingIcon from "./ui/components/LoadingIcon";
import {
  RocketIcon,
  ListRestartIcon,
  StepForwardIcon,
  ActivityIcon,
  CopyPlusIcon,
  MinimizeIcon,
  MaximizeIcon,
  BookOpenIcon,
  BookOpenTextIcon
} from "lucide-react";
import { AnalysisDrawer } from "./AnalysisDrawer";
import { Tooltip } from "./ui/components/Tooltip";
import { IterationDialog } from "./IterationDialog";
import { usePromptManager } from "~/hooks";
import { useModelData } from '~/hooks';
import { PromptVersion } from "~/core/prompt/models/prompt";
import { useTranslation } from "react-i18next";
import { PROMPT_PENDING_MARKER } from '~/core/prompt/services/promptGroupManager';
import { getVersionTooltipText } from '../utils/displayUtils';
import { getButtonPosition } from '../rtl';

export const PromptBooster: React.FC = () => {
  const { t, i18n } = useTranslation();
  // 使用模板钩子
  const {
    displayTemplates,
    isTemplatesLoading,
    getActualTemplateId,
    getOptimizeTemplateOptions,
    hasTemplates
  } = usePromptTemplates();

  // 使用提示词组钩子
  const {
    activeGroup,
    activeVersion,
    isProcessing,
    getGroupVersions,
    switchVersion,
    enhancePrompt,
    iteratePrompt,
    resetSession,
    originalPrompt,
    optimizedPrompt,
  } = usePromptManager();

  // 只保留用于编辑的本地状态
  const [localOriginalPrompt, setLocalOriginalPrompt] = useState("");
  const [editablePrompt, setEditablePrompt] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // 处理"增强中..."文本
  const getDisplayOptimizedPrompt = () => {
    if (optimizedPrompt === PROMPT_PENDING_MARKER ||
      (activeVersion?.status === 'pending' && !optimizedPrompt)) {
      return t('promptBooster.enhancing');
    }
    return optimizedPrompt;
  };

  // 监听原始提示词变化
  useEffect(() => {
    if (!activeGroup) {
      // 如果没有激活的组，使用本地状态
      setLocalOriginalPrompt("");
    }
  }, [activeGroup]);

  // 监听优化提示词变化
  useEffect(() => {
    if (!optimizedPrompt) {
      // 当 optimizedPrompt 为空时重置状态
      setEditablePrompt("");
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

  // 选择的模板和模型
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return localStorage.getItem("selectedTemplateId") || "general-optimize";
  });

  // 获取模型商店
  const { activeModel, setActiveModel, getEnabledModels } = useModelData();

  // 检查当前选择的模型是否还在启用的模型列表中
  const isActiveModelEnabled = getEnabledModels().some(
    (model) => model.id === activeModel
  );

  // 迭代对话框状态
  const [isIterationDialogOpen, setIsIterationDialogOpen] = useState(false);

  // 分析结果状态
  const [analysisResult, setAnalysisResult] =
    useState<PromptAnalysisResult | null>(null);

  // 分析抽屉状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 抽屉是否可关闭状态
  const [isDrawerDismissible, setIsDrawerDismissible] = useState(true);

  // 保存模板选择到localStorage
  useEffect(() => {
    if (selectedTemplateId) {
      localStorage.setItem("selectedTemplateId", selectedTemplateId);
    }
  }, [selectedTemplateId]);

  // 处理原始提示词输入
  const handleOriginalPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setLocalOriginalPrompt(e.target.value);
  };

  // 多版本自动滚动到最新版本位置
  const versionsContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 只在activeGroup存在时执行
    if (!activeGroup) return;

    // 获取当前组的版本数量
    const versionsCount = getGroupVersions(activeGroup.id).length;

    // 只有当容器存在并且版本数量大于0时才滚动
    if (versionsContainerRef.current && versionsCount > 0) {
      // 将滚动位置设置到最右边
      versionsContainerRef.current.scrollLeft =
        versionsContainerRef.current.scrollWidth;
    }
  }, [
    // 依赖数组：当以下值变化时触发效果
    activeGroup?.id, // 当组ID变化时重新计算
    getGroupVersions(activeGroup?.id || "").length, // 当版本数量变化时（新增版本）
  ]);

  // 修改处理函数，只更新本地状态
  const handleOptimizedPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setEditablePrompt(newValue);
  };

  // 处理优化操作
  const handleOptimize = async () => {
    if (!localOriginalPrompt?.trim() || !activeModel) {
      return;
    }

    const activeModelInfo = getEnabledModels().find(
      (model) => model.id === activeModel
    );
    const modelName = activeModelInfo?.name || activeModel;

    const toastId = toast.loading(t("toast.enhancingWithModel", { modelName }));

    try {
      // 直接调用函数获取实际模板ID
      const actualTemplateId = getActualTemplateId(selectedTemplateId);

      await enhancePrompt({
        originalPrompt: localOriginalPrompt,
        templateId: actualTemplateId,
        modelId: activeModel,
        language: i18n.language || 'zh-CN',
      });

      // 更新为成功状态
      toast.success(t("toast.enhancePromptSuccess"), {
        id: toastId,
      });
    } catch (error) {
      console.error("增强过程中出错:", error);

      // 更新为错误状态
      toast.error(t("toast.enhancePromptFailed"), {
        id: toastId,
      });
    }
  };

  // 处理用户手动保存到新版本
  const handleSaveUserModification = async () => {
    try {
      if (!activeGroup) {
        console.error("没有活动的提示词组");
        return;
      }

      await promptService.saveUserModification(activeGroup.id, editablePrompt);

      toast.success(t("toast.saveAsNewVersionSuccess"));
    } catch (error) {
      console.error("保存失败:", error);
      toast.error(t("toast.saveAsNewVersionFailed"));
    }
  };

  // 分析提示词状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // 跟踪是否已使用LLM分析
  const [hasUsedLLMAnalysis, setHasUsedLLMAnalysis] = useState(false);

  // 处理基础分析操作(从主界面按钮调用)：使用本地评分
  const handleAnalyze = async () => {
    if (!optimizedPrompt || !optimizedPrompt.trim()) return;

    try {
      setIsDrawerOpen(true);
      setIsAnalyzing(true);
      // 设置抽屉为可关闭状态
      setIsDrawerDismissible(true);

      // 使用本地分析方法，确保i18n.language有默认值
      const result = analyzePromptQuality(optimizedPrompt, i18n.language || 'zh-CN');
      setAnalysisResult(result);

      // 重置LLM分析使用状态(每次打开抽屉时重置)
      setHasUsedLLMAnalysis(false);
    } catch (err: any) {
      toast.error(err.message || t("toast.analyzePromptFailed"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 新增：处理LLM分析操作(从抽屉内部按钮调用)
  const handleLLMAnalyze = async () => {
    if (!optimizedPrompt || !optimizedPrompt.trim()) return;

    // 获取当前模型名称
    const activeModelInfo = getEnabledModels().find(
      (model) => model.id === activeModel
    );
    const modelName = activeModelInfo?.name || activeModel;

    // 创建 loading toast
    const toastId = toast.loading(t("toast.analyzingWithModel", { modelName }));

    try {
      setIsAnalyzing(true);
      // 设置抽屉为不可关闭状态
      setIsDrawerDismissible(false);

      // 尝试使用LLM分析
      let result;
      try {
        result = await analyzePromptWithLLM(optimizedPrompt, displayOriginalPrompt, i18n.language || 'zh-CN');
        // 标记已使用LLM分析
        setHasUsedLLMAnalysis(true);

        // 更新为成功状态
        toast.success(t("toast.analyzingSuccess"), {
          id: toastId,
        });
      } catch (e: any) {
        const errorType = e.errorType || 'unknown';

        // 根据错误类型显示不同的toast错误信息
        switch (errorType) {
          case 'connection':
            toast.error(t("toast.connection.error", { error: e.message }), {
              id: toastId,
            });
            break;
          case 'auth':
            toast.error(t("toast.connection.authFailed", { error: e.message }), {
              id: toastId,
            });
            break;
          case 'validation':
            toast.error(t("toast.connection.requestError", { error: e.message }), {
              id: toastId,
            });
            break;
          case 'parse':
            toast.error(t("toast.connection.parseError", { error: e.message }), {
              id: toastId,
            });
            break;
          default:
            toast.error(t("toast.connection.unexpectedError", { error: e.message }), {
              id: toastId,
            });
        }

        console.warn("[Fallback] LLM 评分失败，尝试使用本地分析");
        result = analyzePromptQuality(optimizedPrompt, i18n.language || 'zh-CN');
        toast.warning(t("toast.analyzePromptLLMFailed"));
        setIsDrawerDismissible(true);
      }

      setAnalysisResult(result);
    } catch (err: any) {
      toast.error(err.message || t("toast.analyzePromptFailed"), {
        id: toastId,
      });
      setIsDrawerDismissible(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 当抽屉关闭时重置按钮显示状态
  useEffect(() => {
    if (!isDrawerOpen) {
      // 下次打开抽屉时重置LLM分析状态
      setHasUsedLLMAnalysis(false);
    }
  }, [isDrawerOpen]);

  // 自动切换到有效模型接口
  useEffect(() => {
    // 获取可用模型列表
    const enabledModels = getEnabledModels();

    // 如果当前选中的模型不在可用列表中，且有可用模型，则切换到第一个可用模型
    if (
      activeModel &&
      !enabledModels.some((model) => model.id === activeModel) &&
      enabledModels.length > 0
    ) {
      const firstAvailableModel = enabledModels[0].id;
      setActiveModel(firstAvailableModel);
      console.log("模型不可用，已自动切换到:", firstAvailableModel);
    }
    // 注意：我们不再尝试设置为null，因为setActiveModel不接受null
  }, [activeModel, getEnabledModels]);

  // 处理迭代对话框提交
  const handleIterationSubmit = async (
    templateId: string,
    direction: string
  ) => {
    if (!activeGroup) return;

    // 获取模型名称用于 toast 消息
    const activeModelInfo = getEnabledModels().find(
      (model) => model.id === activeModel
    );
    const modelName = activeModelInfo?.name || activeModel;

    // 创建 loading toast
    const toastId = toast.loading(t("toast.iteratingWithModel", { modelName }));

    try {
      // 获取实际的模板ID
      const actualTemplateId = getActualTemplateId(templateId);

      await iteratePrompt({
        groupId: activeGroup.id,
        direction,
        templateId: actualTemplateId,
        modelId: activeModel,
        language: i18n.language || 'zh-CN',
      });

      setIsIterationDialogOpen(false);

      // 更新为成功状态
      toast.success(t("toast.iterationSuccess"), {
        id: toastId
      });
    } catch (error) {
      console.error("迭代失败:", error);

      // 更新为错误状态
      toast.error(t("toast.iterationFailed"), {
        id: toastId
      });
    }
  };

  // 处理确认重置
  const handleConfirmReset = () => {
    handleReset();
    setIsResetDialogOpen(false);
  };

  // 处理清空并重新开始
  const handleReset = () => {
    resetSession();
    setLocalOriginalPrompt('');
    setEditablePrompt('');
    setIsEditMode(false);
    toast.info(t('toast.workspaceResetSuccess'));
  };

  // 计算字符差异
  const calculateCharDiff = () => {
    const original = activeGroup ? originalPrompt : localOriginalPrompt;
    const diff = optimizedPrompt.length - (original?.length || 0);
    return `${diff > 0 ? '+' : ''}${diff}`;
  };

  // 决定显示什么内容
  const displayOriginalPrompt = activeGroup ? originalPrompt : localOriginalPrompt;

  // 最大化状态声明
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 定义动画配置接口
  interface AnimationConfig {
    duration: number;
    ease: [number, number, number, number];
  }

  // 动画配置
  const animationConfig: AnimationConfig = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  };

  // 重置对话框状态声明
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 原始提示词区域 */}
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
        <div className="p-4 border rounded-xl shadow-2xs secondary-container">
          <div className="flex justify-between items-center mb-4">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold title-secondary">
              <BookOpenIcon size={20} />
              {t("promptBooster.originalPrompt")}
            </h2>
            {activeGroup && (
              <Tooltip text={t("promptBooster.resetWorkspace")}>
                <AnimatedButton
                  className="px-3 py-2 text-sm flex items-center gap-1 button-danger"
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  <ListRestartIcon size={18} />
                  <span className="hidden sm:block">
                    {t("common.buttons.reset")}
                  </span>
                </AnimatedButton>
              </Tooltip>
            )}
          </div>

          <EnhancedTextarea
            id="original-prompt"
            value={displayOriginalPrompt || ""}
            onChange={handleOriginalPromptChange}
            placeholder={t("promptBooster.originalInput")}
            className="input-textarea"
            rows={5}
            showCharCount={true}
            disabled={isProcessing || Boolean(activeGroup)}
            buttonPosition={getButtonPosition('top-right')}
            filename={t("promptBooster.originalPrompt")}
            showDownloadDocx={false}
          />
        </div>
      </motion.div>

      {/* 控制栏 */}
      <motion.div className="flex items-end gap-3">
        <div className="min-w-[26%] inline-block relative">
          <label className="block text-sm font-medium mb-2 whitespace-nowrap truncate input-description" htmlFor="template-select">
            {t("promptBooster.templateSelect")}
          </label>
          <div className="relative">
            <EnhancedDropdown
              id="template-select"
              options={getOptimizeTemplateOptions()}
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              placeholder={t("promptBooster.templatePlaceholder")}
              disabled={isProcessing || isTemplatesLoading}
              className=""
            />
            {isTemplatesLoading && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <LoadingIcon />
              </div>
            )}
          </div>
          {!isTemplatesLoading && !hasTemplates && (
            <div className="mt-2 p-2 text-center text-sm dropdown-null">
              {t("promptBooster.noTemplatesAvailable")}
            </div>
          )}
        </div>

        <div className="min-w-[33%] grow">
          <label className="block text-sm font-medium mb-2 input-description" htmlFor="model-select">
            {t("promptBooster.modelSelect")}
          </label>
          <EnhancedDropdown
            id="model-select"
            options={getEnabledModels().map((model) => ({
              value: model.id,
              label: model.name,
            }))}
            value={activeModel}
            onChange={setActiveModel}
            placeholder={t("promptBooster.modelPlaceholder")}
            disabled={isProcessing}
            className=""
          />
        </div>

        <Tooltip text={t("promptBooster.enhancePrompt")}>
          <AnimatedButton
            className={`flex gap-2 justify-center items-center h-10 w-10 sm:w-auto sm:px-4 truncate button-confirm 
                        ${isProcessing ? "cursor-not-allowed opacity-50" : ""}`}
            onClick={handleOptimize}
            disabled={
              isProcessing ||
              !localOriginalPrompt?.trim() ||
              !isActiveModelEnabled ||
              !displayTemplates[selectedTemplateId] ||
              Boolean(activeGroup)
            }
          >
            <RocketIcon size={16} />
            <span className="hidden sm:block">
              {isProcessing
                ? t("promptBooster.enhancing")
                : t("promptBooster.startEnhance")}
            </span>
          </AnimatedButton>
        </Tooltip>
      </motion.div>

      {/* 增强提示词区域 */}
      <motion.div
        layoutId="enhanced-prompt-area"
        className={`flex flex-col flex-grow p-4 border rounded-xl shadow-2xs secondary-container
        ${isMaximized
            ? "h-[calc(100vh-280px)] md:h-full"
            : "h-full"
          }`}
      >
        {/* 标题栏 */}
        <div className="flex w-full mb-4 gap-2 items-center">
          {/* 标题 */}
          <div className="inline-flex flex-shrink items-center gap-2 md:w-fit min-w-[65px] truncate">
            <BookOpenTextIcon size={20} />
            <h2 className="text-xl font-semibold title-secondary">
              {t("promptBooster.enhancedPrompt")}
            </h2>
          </div>
          {/* 版本切换标签 */}
          <div className="flex-grow flex-shrink min-w-0 overflow-hidden [&::-webkit-scrollbar]:h-1 scrollbar-thin">
            {activeGroup && (
              <div
                ref={versionsContainerRef}
                className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar w-full py-1 [&::-webkit-scrollbar]:h-1"
              >
                {getGroupVersions(activeGroup.id).map(
                  (version: PromptVersion) => (
                    <Tooltip
                      key={version.id}
                      text={getVersionTooltipText(version, t)}
                    >
                      <AnimatedButton
                        onClick={() => {
                          switchVersion(activeGroup.id, version.number);
                          setIsEditMode(false);
                        }}
                        className={`flex-none px-2 py-1 text-xs rounded-full min-w-[32px] ${version.number === activeVersion?.number
                          ? "version-tag-active"
                          : "version-tag-inactive"
                          }`}
                      >
                        v{version.number}
                      </AnimatedButton>
                    </Tooltip>
                  )
                )}
              </div>
            )}
          </div>

          {/* 处理中指示器 */}
          {isProcessing && (
            <div className="flex-shrink-0 me-4 flex items-center">
              <LoadingIcon className="text-blue-500" />
            </div>
          )}

          {/* 副按钮区域 */}
          <div className="flex-shrink-0 flex gap-2">
            <AnimatedButton
              className={`text-sm flex items-center gap-1 px-3 py-2 ${activeGroup ? "button-confirm" : "button-third"}`}
              onClick={() => setIsIterationDialogOpen(true)}
              disabled={!optimizedPrompt || isProcessing || !activeGroup}
            >
              <StepForwardIcon size={14} />
              <span className="hidden md:block">
                {t("promptBooster.continueIteration")}
              </span>
            </AnimatedButton>

            <AnimatedButton
              className="text-sm flex items-center gap-1 px-3 py-2 button-third"
              onClick={handleAnalyze}
              disabled={
                !optimizedPrompt || isProcessing || !activeGroup || isAnalyzing
              }
            >
              {isAnalyzing ? (
                <>
                  <LoadingIcon />
                  <span className="hidden md:block">
                    {t("promptBooster.analyzing")}
                  </span>
                </>
              ) : (
                <>
                  <ActivityIcon size={14} />
                  <span className="hidden md:block">
                    {t("promptBooster.analyzePrompt")}
                  </span>
                </>
              )}
            </AnimatedButton>

            <AnimatedButton
              className="text-sm flex items-center gap-1 px-3 py-2 button-third"
              onClick={() => {
                setIsAnimating(true);
                setIsMaximized(!isMaximized);
                // 动画结束后重置状态
                setTimeout(() => {
                  setIsAnimating(false);
                }, animationConfig.duration * 1000);
              }}
              disabled={!displayOriginalPrompt?.trim() || isAnimating}
            >
              {isMaximized ? (
                <>
                  <MinimizeIcon size={14} />
                  <span className="hidden md:block">
                    {t("common.buttons.restore")}
                  </span>
                </>
              ) : (
                <>
                  <MaximizeIcon size={14} />
                  <span className="hidden md:block">
                    {t("common.buttons.maximize")}
                  </span>
                </>
              )}
            </AnimatedButton>
          </div>
        </div>

        {/* 增强提示词文本域 */}
        <div className="relative flex-grow flex flex-col h-[calc(100vh-650px)] md:h-full">
          <AutoScrollTextarea
            id="enhancement-textarea"
            className={`flex-grow rounded-lg border autoscroll-content 
                            ${!optimizedPrompt && !isProcessing
                ? "flex justify-center items-center text-center"
                : "h-full"
              }`}
            value={isEditMode ? editablePrompt : getDisplayOptimizedPrompt()}
            onChange={handleOptimizedPromptChange}
            placeholder={
              isProcessing
                ? t("promptBooster.enhancing")
                : t("promptBooster.enhancedPromptPlaceholder")
            }
            readOnly={isProcessing || !isEditMode}
            streaming={isProcessing}
            buttonText=""
            centerPlaceholder={!isProcessing && !optimizedPrompt}
            buttonPosition={getButtonPosition('top-right')}
            showDownloadDocx={false}
          />
          {isEditMode &&
            editablePrompt !== optimizedPrompt &&
            !isProcessing && (
              <Tooltip
                text={t("promptBooster.saveAsNewVersion")}
                position="top"
              >
                <AnimatedButton
                  onClick={handleSaveUserModification}
                  className="absolute animate-pulse mt-40 bottom-4 right-4 text-sm px-3 py-2 shadow-sm flex items-center gap-1 transition-colors button-save-as"
                >
                  <CopyPlusIcon size={14} />
                  <span className="hidden md:block">
                    {t("promptBooster.saveAs")}
                  </span>
                </AnimatedButton>
              </Tooltip>
            )}
        </div>

        {/* 字符数差异 */}
        <div className="mt-2 flex justify-end">
          <div className="text-sm input-charactor-counter">
            {t("promptBooster.charDiff", {
              count: Number(calculateCharDiff()),
            })}
          </div>
        </div>
      </motion.div>

      {/* 分析结果抽屉 */}
      <AnalysisDrawer
        isOpen={isDrawerOpen}
        isAnalyzing={isAnalyzing}
        isDismissible={isDrawerDismissible}
        hasUsedLLMAnalysis={hasUsedLLMAnalysis}
        isActiveModelEnabled={isActiveModelEnabled}
        analysisResult={analysisResult}
        onClose={() => setIsDrawerOpen(false)}
        onLLMAnalyze={handleLLMAnalyze}
      />

      {/* 迭代对话框 */}
      <IterationDialog
        isOpen={isIterationDialogOpen}
        onClose={() => setIsIterationDialogOpen(false)}
        onSubmit={handleIterationSubmit}
      />

      {/* 重置确认对话框 */}
      <Dialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title={t("promptBooster.confirmResetTitle")}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <AnimatedButton
              className="px-4 py-2 button-cancel"
              onClick={() => setIsResetDialogOpen(false)}
            >
              {t("common.buttons.cancel")}
            </AnimatedButton>
            <AnimatedButton
              className="px-4 py-2 button-danger"
              onClick={handleConfirmReset}
            >
              {t("promptBooster.confirmResetTitle")}
            </AnimatedButton>
          </div>
        }
      >
        <p>{t("promptBooster.confirmResetMsg")}</p>
      </Dialog>
    </div>
  );
};