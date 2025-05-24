import React, { useState, useEffect, useRef } from "react";
import { promptService } from "@prompt-booster/core/prompt/services/promptService";
// import templates from '@prompt-booster/core/prompt/templates/default-templates.json';
import medalImage from "../assets/medal.png";
import { getAllTemplatesAsRecord } from "@prompt-booster/core/prompt/services/templateService";
import { Template } from "@prompt-booster/core/prompt/models/template";
import {
  analyzePromptWithLLM,
  PromptAnalysisResult,
  CriterionItem,
  handleTemplateLocalization,
} from "@prompt-booster/core/prompt/utils/promptUtils";
import { analyzePromptQuality } from "@prompt-booster/core/prompt/utils/promptAnalysisUtils";
import {
  toast,
  EnhancedTextarea,
  AutoScrollTextarea,
  EnhancedDropdown,
  Dialog,
} from "@prompt-booster/ui";
import LoadingIcon from "@prompt-booster/ui/components/LoadingIcon";
import {
  RocketIcon,
  ListRestartIcon,
  StepForwardIcon,
  ChartBarIcon,
  CopyPlusIcon,
  MinimizeIcon,
  MaximizeIcon,
  SquareCheckBigIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { Tooltip } from "@prompt-booster/ui/components/Tooltip";
import { IterationDialog } from "./IterationDialog";
import { usePrompt } from "@prompt-booster/core/prompt/hooks/usePrompt";
import { useModelStore } from "@prompt-booster/core/model/store/modelStore";
import { PromptVersion } from "@prompt-booster/core/prompt/models/prompt";
import { useTranslation } from "react-i18next";
import { PROMPT_PENDING_MARKER } from '@prompt-booster/core/prompt/services/promptGroupManager';

export const PromptBooster: React.FC = () => {
  const { t, i18n } = useTranslation();
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
  } = usePrompt();

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
      setEditablePrompt("");
      setIsEditMode(false);
    } else if (isProcessing) {
      setEditablePrompt(optimizedPrompt);
      setIsEditMode(false);
    } else if (!isProcessing && optimizedPrompt) {
      setEditablePrompt(optimizedPrompt);
      setIsEditMode(true);
    }
  }, [optimizedPrompt, isProcessing]);

  // 选择的模板和模型
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return localStorage.getItem("selectedTemplateId") || "general-optimize";
  });

  // 新增状态来存储模板列表
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);

  const [displayTemplates, setDisplayTemplates] = useState<
    Record<string, Template>
  >({});
  const [getActualTemplateId, setGetActualTemplateId] = useState<
    (id: string) => string
  >(
    () =>
      (id: string): string =>
        id
  );

  // 加载模板列表
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const templatesRecord = await getAllTemplatesAsRecord();
        setTemplates(templatesRecord);

        // 应用模板本地化
        const {
          displayTemplates: localizedTemplates,
          getActualTemplateId: idMapper,
        } = handleTemplateLocalization(templatesRecord, i18n.language);
        setDisplayTemplates(localizedTemplates);
        setGetActualTemplateId(() => idMapper);

        if (Object.keys(templatesRecord).length > 0) {
          console.log(
            t("toast.loadTemplatesSuccess", {
              count: Object.keys(templatesRecord).length,
            })
          );
          // toast.success(t('toast.loadTemplatesSuccess', { count: Object.keys(templatesRecord).length }));
        } else {
          toast.info(t("toast.noTemplatesAvailable"));
        }
      } catch (error) {
        console.error("加载模板失败:", error);
        toast.error(t("toast.loadTemplatesFailed"));
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [t, i18n.language]);

  // 获取模型商店
  const { activeModel, setActiveModel, getEnabledModels } = useModelStore();

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

  // 3. 添加一个useEffect监听流式响应结束
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

  // 4. 修改处理函数，只更新本地状态
  const handleOptimizedPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setEditablePrompt(newValue);
  };

  // 处理优化操作
  const handleOptimize = async () => {
    if (!localOriginalPrompt || !localOriginalPrompt.trim() || !activeModel) {
      return;
    }

    try {
      const activeModelInfo = getEnabledModels().find(
        (model) => model.id === activeModel
      );
      const modelName = activeModelInfo?.name || activeModel;

      toast.info(t("toast.enhancingWithModel", { modelName }));

      const actualTemplateId = getActualTemplateId(selectedTemplateId);

      await enhancePrompt({
        originalPrompt: localOriginalPrompt,
        templateId: actualTemplateId,
        modelId: activeModel,
        language: i18n.language,
      });

      toast.success(t("toast.enhancePromptSuccess"));
    } catch (error) {
      console.error("增强过程中出错:", error);
      toast.error(t("toast.enhancePromptFailed"));
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
  const [loading, setLoading] = useState(false);
  // 跟踪是否已使用LLM分析
  const [hasUsedLLMAnalysis, setHasUsedLLMAnalysis] = useState(false);

  // 处理基础分析操作(从主界面按钮调用)：使用本地评分
  const handleAnalyze = async () => {
    if (!optimizedPrompt || !optimizedPrompt.trim()) return;

    try {
      setIsDrawerOpen(true);
      setLoading(true);
      // 设置抽屉为可关闭状态
      setIsDrawerDismissible(true);

      // 使用本地分析方法
      const result = analyzePromptQuality(optimizedPrompt, i18n.language);
      setAnalysisResult(result);

      // 重置LLM分析使用状态(每次打开抽屉时重置)
      setHasUsedLLMAnalysis(false);
    } catch (err: any) {
      toast.error(err.message || t("toast.analyzePromptFailed"));
    } finally {
      setLoading(false);
    }
  };

  // 新增：处理LLM分析操作(从抽屉内部按钮调用)
  const handleLLMAnalyze = async () => {
    if (!optimizedPrompt || !optimizedPrompt.trim()) return;

    try {
      setLoading(true);
      // 设置抽屉为不可关闭状态
      setIsDrawerDismissible(false);

      // 尝试使用LLM分析
      let result;
      try {
        result = await analyzePromptWithLLM(optimizedPrompt, i18n.language);
        // 标记已使用LLM分析
        setHasUsedLLMAnalysis(true);
      } catch (e) {
        console.warn("[Fallback] LLM 评分失败，尝试使用本地分析:", e);
        result = analyzePromptQuality(optimizedPrompt);
        toast.warning(t("toast.analyzePromptLLMFailed"));
      }

      setAnalysisResult(result);
    } catch (err: any) {
      toast.error(err.message || t("toast.analyzePromptFailed"));
    } finally {
      setLoading(false);
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

    try {
      // 获取实际的模板ID
      const actualTemplateId = getActualTemplateId(templateId);

      await iteratePrompt({
        groupId: activeGroup.id,
        direction,
        templateId: actualTemplateId,
        modelId: activeModel,
        language: i18n.language,
      });

      setIsIterationDialogOpen(false);
    } catch (error) {
      console.error("迭代失败:", error);
      toast.error(t("toast.iterationFailed"));
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

  // 重置对话框状态声明
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <div className="grid-cols-1 gap-6 md:min-h-[550px] flex flex-col flex-grow">
      {/* 原始提示词区域 */}
      {!isMaximized && (
        <div className="p-4 border rounded-lg shadow-2xs flex-none secondary-container">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold title-secondary">
              {t("promptBooster.originalPrompt")}
            </h2>
            {activeGroup && (
              <Tooltip text={t("promptBooster.resetWorkspace")}>
                <button
                  className="px-3 py-2 text-sm flex items-center gap-1 rounded-md button-danger"
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  <ListRestartIcon size={18} />
                  <span className="hidden sm:block">
                    {t("common.buttons.reset")}
                  </span>
                </button>
              </Tooltip>
            )}
          </div>

          <EnhancedTextarea
            value={displayOriginalPrompt || ""}
            onChange={handleOriginalPromptChange}
            placeholder={t("promptBooster.originalInput")}
            className="input-textarea"
            rows={5}
            showCharCount={true}
            disabled={isProcessing || Boolean(activeGroup)}
          />
        </div>
      )}

      {/* 控制栏 */}
      <div className="flex items-end gap-3">
        <div className="min-w-[26%] inline-block relative">
          <label className="block text-sm font-medium mb-2 whitespace-nowrap truncate input-description">
            {t("promptBooster.templateSelect")}
          </label>
          <div className="relative">
            <EnhancedDropdown
              options={Object.entries(displayTemplates)
                .filter(
                  ([_, template]) =>
                    template.metadata?.templateType === "optimize"
                )
                .map(([id, template]) => ({
                  value: id,
                  label: template.name,
                }))}
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
          {!isTemplatesLoading && Object.keys(templates).length === 0 && (
            <div className="mt-2 p-2 text-center text-sm dropdown-null">
              {t("promptBooster.noTemplatesAvailable")}
            </div>
          )}
        </div>

        <div className="min-w-[33%] grow">
          <label className="block text-sm font-medium mb-2 input-description">
            {t("promptBooster.modelSelect")}
          </label>
          <EnhancedDropdown
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
          <button
            className={`flex gap-2 items-center h-10 px-4 py-2 rounded-md truncate button-confirm 
                            ${isProcessing
                ? "cursor-not-allowed opacity-50"
                : ""
              }`}
            onClick={handleOptimize}
            disabled={
              isProcessing ||
              !localOriginalPrompt ||
              !localOriginalPrompt.trim() ||
              !isActiveModelEnabled ||
              !selectedTemplateId ||
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
          </button>
        </Tooltip>
      </div>

      {/* 增强提示词区域 */}
      <div
        className={`flex flex-col flex-grow md:min-h-0 p-4 border rounded-lg shadow-2xs secondary-container
                    ${isMaximized
            ? "min-h-[calc(100vh-260px)]"
            : "min-h-[calc(100vh-550px)]"
          }`}
      >
        <div className="flex w-full mb-4 gap-2">
          {/* 父容器 */}
          <div className="flex-shrink  md:w-fit min-w-[95px]">
            <h2 className="text-xl font-semibold truncate title-secondary">
              {t("promptBooster.enhancedPrompt")}
            </h2>
          </div>
          {/* 版本切换标签 */}
          <div className="flex-grow flex-shrink min-w-0 overflow-hidden [&::-webkit-scrollbar]:h-1 scrollbar-thin">
            {activeGroup && (
              <div
                ref={versionsContainerRef}
                className="flex items-center gap-2 pr-2 overflow-x-auto no-scrollbar w-full py-1 [&::-webkit-scrollbar]:h-1"
              >
                {getGroupVersions(activeGroup.id).map(
                  (version: PromptVersion) => (
                    <button
                      key={version.id}
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
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* 处理中指示器 */}
          {isProcessing && (
            <div className="flex-shrink-0 mr-4 flex items-center">
              <LoadingIcon />
            </div>
          )}

          {/* 按钮区域 */}
          <div className="flex-shrink-0 flex gap-2">
            <button
              className={`text-sm flex items-center gap-1 rounded-lg px-3 py-2 ${activeGroup ? "button-confirm" : "button-third"}`}
              onClick={() => setIsIterationDialogOpen(true)}
              disabled={!optimizedPrompt || isProcessing || !activeGroup}
            >
              <StepForwardIcon size={14} />
              <span className="hidden md:block">
                {t("promptBooster.continueIteration")}
              </span>
            </button>

            <button
              className="text-sm flex items-center gap-1 rounded-lg px-3 py-2 button-third"
              onClick={handleAnalyze}
              disabled={
                !optimizedPrompt || isProcessing || !activeGroup || loading
              }
            >
              {loading ? (
                <>
                  <LoadingIcon />
                  <span className="hidden md:block">
                    {t("promptBooster.analyzing")}
                  </span>
                </>
              ) : (
                <>
                  <ChartBarIcon size={14} />
                  <span className="hidden md:block">
                    {t("promptBooster.analyzePrompt")}
                  </span>
                </>
              )}
            </button>

            <button
              className="text-sm flex items-center gap-1 rounded-lg px-3 py-2 button-third"
              onClick={() => setIsMaximized(!isMaximized)}
              disabled={!optimizedPrompt || !activeGroup}
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
            </button>
          </div>
        </div>

        {/* 增强提示词文本域 */}
        <div className="relative flex-grow flex flex-col">
          <AutoScrollTextarea
            className={`flex-grow rounded-lg border autoscroll-content 
                            ${!optimizedPrompt && !isProcessing
                ? "flex justify-center items-center text-center"
                : ""
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
          />
          {isEditMode &&
            editablePrompt !== optimizedPrompt &&
            !isProcessing && (
              <Tooltip
                text={t("promptBooster.saveAsNewVersion")}
                position="top"
              >
                <button
                  onClick={handleSaveUserModification}
                  className="absolute animate-pulse mt-40 bottom-4 right-4 text-sm px-3 py-2 rounded-md shadow-sm flex items-center gap-1 transition-colors button-save-as"
                >
                  <CopyPlusIcon size={14} />
                  <span className="hidden md:block">
                    {t("promptBooster.saveAs")}
                  </span>
                </button>
              </Tooltip>
            )}
        </div>

        {/* 分析结果抽屉 */}
        <Drawer.Root
          dismissible={isDrawerDismissible}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 mask" />
            <Drawer.Content className="drawer-content-container backdrop-blur-md flex flex-col rounded-t-2xl drop-shadow-[0_-15px_15px_rgba(0,0,0,0.15)] fixed bottom-0 left-0 right-0 max-h-[85vh] z-40">
              <div className="p-3 pt-2 overflow-y-auto">
                {/* 🎉 满分彩带 */}
                {analysisResult && analysisResult.score >= 10 && (
                  <Confetti
                    key={hasUsedLLMAnalysis ? 'llm-analysis' : 'local-analysis'}
                    width={window.innerWidth}
                    numberOfPieces={200}
                    gravity={0.3}
                    recycle={false}
                    initialVelocityY={10}
                    tweenDuration={5000}
                    run={true}
                  />
                )}
                {/* 抽屉把手 */}
                <div className="mx-auto w-12 h-1 shrink-0 rounded-full drawer-handle mb-4" />
                <div className="max-w-[680px] mx-6 md:mx-auto">
                  {/* 主体：加载中骨架 vs 分析结果 */}
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="mb-4 flex justify-between items-center">
                        {/* 标题骨架 */}
                        <Drawer.Title className="h-8 drawer-skeleton rounded w-1/3" />

                        {/* 分数骨架 */}
                        <div className="flex justify-center items-center gap-2">
                          <span className="h-8 drawer-skeleton rounded w-16" />
                          <span className="h-8 drawer-skeleton rounded w-8" />
                        </div>
                      </div>
                      <Drawer.Description className="h-3 drawer-skeleton rounded w-full mt-1"></Drawer.Description>

                      {/* 三条维度骨架 */}
                      <div className="p-4 drawer-analysis-container rounded-lg">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2 mb-4 last:mb-0">
                            <div className="h-4 drawer-skeleton rounded w-3/4" />
                            <div className="h-3 drawer-skeleton rounded w-1/2" />
                          </div>
                        ))}
                      </div>

                      {/* 三条综合建议骨架 */}
                      <div className="mt-4 p-4 drawer-suggestion-container rounded-lg">
                        <div className="h-4 drawer-skeleton rounded w-1/5 mb-2" />
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-3 drawer-skeleton rounded w-full mb-1"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 标题和评分 */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center">
                          <div className="relative inline-flex items-center">
                            <Drawer.Title className="text-lg font-semibold drawer-title">
                              {t("promptBooster.drawer.title")}
                            </Drawer.Title>
                            {analysisResult?.score === 10 && (
                              <motion.img
                                src={medalImage}
                                alt="满分徽章"
                                initial={{ scale: 5.8, opacity: 0, rotate: 15 }}
                                animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute -top-2 -right-12 w-10 h-10 pointer-events-none"
                              />
                            )}
                          </div>
                          <span className="text-xl font-bold drawer-score">
                            {analysisResult?.score}/10
                          </span>
                        </div>

                        <Drawer.Description className="text-sm mt-1 drawer-description">
                          {t("promptBooster.drawer.description")}
                        </Drawer.Description>

                        {/* 鼓励语 ✅ 移到评分下方 */}
                        {analysisResult?.encouragement && (
                          <div className="mt-2 text-sm italic drawer-encouragement">
                            🎉 {analysisResult.encouragement}
                          </div>
                        )}
                      </div>

                      {/* 分析维度 */}
                      {analysisResult?.criteria && (
                        <div className="p-4 drawer-analysis-container rounded-lg mb-4">
                          <ul className="space-y-2 text-sm">
                            {analysisResult.criteria.map(
                              (item: CriterionItem, i: number) => (
                                <li
                                  key={i}
                                  className="flex gap-2 items-start justify-between"
                                >
                                  <div className="flex items-start gap-2 w-[85%]">
                                    <span
                                      className={
                                        item.passed
                                          ? "drawer-analysis-passed"
                                          : "drawer-analysis-failed"
                                      }
                                    >
                                      {item.passed ? (
                                        <SquareCheckBigIcon size={18} />
                                      ) : (
                                        <TriangleAlertIcon size={18} />
                                      )}
                                    </span>
                                    <div>
                                      <div className="font-medium drawer-analysis-label">
                                        {item.label}
                                      </div>
                                      <div className="drawer-analysis-feedback">
                                        {item.feedback}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs whitespace-nowrap text-gray-400 font-mono">
                                    {item.passed
                                      ? t("promptBooster.drawer.score.points", {
                                        points: item.points,
                                      })
                                      : t("promptBooster.drawer.score.zero")}
                                  </div>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {/* 迭代建议 */}
                      {(analysisResult?.criteria.some(
                        (c) => !c.passed && c.suggestion
                      ) ||
                        analysisResult?.suggestions?.length) && (
                          <div className="p-4 mt-2 drawer-suggestion-container rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-semibold drawer-suggestion-title">
                                {t("promptBooster.drawer.suggestionsTitle")}
                              </h4>
                              <button
                                className="text-sm font-semibold drawer-suggestion-copy hover:underline"
                                onClick={() => {
                                  const criteriaTips = analysisResult.criteria
                                    .filter((c) => !c.passed && c.suggestion)
                                    .map((c) => c.suggestion!);
                                  const globalTips =
                                    analysisResult.suggestions || [];
                                  const allTips = [
                                    ...criteriaTips,
                                    ...globalTips,
                                  ];
                                  navigator.clipboard
                                    .writeText(allTips.join("\n"))
                                    .then(() =>
                                      toast.success(
                                        t("toast.copySuggestionSuccess")
                                      )
                                    )
                                    .catch(() =>
                                      toast.error(t("toast.copyFailed"))
                                    );
                                }}
                              >
                                {t("promptBooster.drawer.copyAll")}
                              </button>
                            </div>
                            <ul className="list-disc pl-5 drawer-suggestion-title space-y-1">
                              {[
                                // 先放各维度未通过的建议
                                ...analysisResult.criteria
                                  .filter((c) => !c.passed && c.suggestion)
                                  .map((c) => c.suggestion!),
                                // 再放全局 suggestions
                                ...(analysisResult.suggestions || []),
                              ].map((tip, i) => (
                                <li key={i} className="text-sm font-medium">
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </>
                  )}
                  <div className="mt-4 flex justify-center">
                    {!hasUsedLLMAnalysis && (
                      <Tooltip
                        text={
                          !isActiveModelEnabled
                            ? t("promptBooster.drawer.enableModelFirst")
                            : ""
                        }
                        position="top"
                        disabled={isActiveModelEnabled}
                      >
                        <div>
                          {" "}
                          {/* 使用div作为disabled按钮的容器，确保onMouseEnter触发 */}
                          <button
                            className="px-4 py-2 text-sm button-confirm rounded-md transition"
                            onClick={handleLLMAnalyze}
                            disabled={loading || !isActiveModelEnabled}
                          >
                            {loading ? (
                              <span className="flex items-center gap-2">
                                <LoadingIcon />
                                {t("promptBooster.analyzing")}
                              </span>
                            ) : (
                              t("promptBooster.drawer.deepAnalysis")
                            )}
                          </button>
                        </div>
                      </Tooltip>
                    )}
                    <button
                      className="px-4 py-2 ml-2 text-sm button-cancel rounded-md transition"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      {t("common.buttons.close")}
                    </button>
                  </div>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* 字符数差异 */}
        <div className="mt-2 flex justify-end">
          <div className="text-sm input-charactor-counter">
            {t("promptBooster.charDiff", {
              count: Number(calculateCharDiff()),
            })}
          </div>
        </div>
      </div>

      {/* 迭代对话框 */}
      <IterationDialog
        isOpen={isIterationDialogOpen}
        onClose={() => setIsIterationDialogOpen(false)}
        onSubmit={handleIterationSubmit}
        templates={displayTemplates}
      />

      {/* 重置确认对话框 */}
      <Dialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title={t("promptBooster.confirmResetTitle")}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-md button-cancel"
              onClick={() => setIsResetDialogOpen(false)}
            >
              {t("common.buttons.cancel")}
            </button>
            <button
              className="px-4 py-2 rounded-md button-danger"
              onClick={handleConfirmReset}
            >
              {t("promptBooster.confirmResetTitle")}
            </button>
          </div>
        }
      >
        <p>{t("promptBooster.confirmResetMsg")}</p>
      </Dialog>
    </div>
  );
};