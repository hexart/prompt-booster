import React from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";
import {
  SquareCheckBigIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast, Tooltip } from "@prompt-booster/ui";
import LoadingIcon from "@prompt-booster/ui/components/LoadingIcon";
import medalImage from "../assets/medal.png";
import {
  PromptAnalysisResult,
  CriterionItem,
} from "@prompt-booster/core/prompt/utils/promptUtils";

interface AnalysisDrawerProps {
  // 状态
  isOpen: boolean;
  isAnalyzing: boolean;
  isDismissible: boolean;
  hasUsedLLMAnalysis: boolean;
  isActiveModelEnabled: boolean;
  analysisResult: PromptAnalysisResult | null;
  
  // 回调函数
  onClose: () => void;
  onLLMAnalyze: () => void;
}

export const AnalysisDrawer: React.FC<AnalysisDrawerProps> = ({
  isOpen,
  isAnalyzing,
  isDismissible,
  hasUsedLLMAnalysis,
  isActiveModelEnabled,
  analysisResult,
  onClose,
  onLLMAnalyze,
}) => {
  const { t } = useTranslation();

  // 格式化迭代建议
  const formatSuggestionForMarkdown = (suggestion: string) => {
    // 如果建议已经包含序号或标记，保持原格式
    if (suggestion.match(/^[\d\-\*\+]\s/)) {
      return suggestion;
    }
    // 否则添加 Markdown 列表格式
    return `- ${suggestion}`;
  };

  // 复制所有迭代建议
  const copyAllSuggestions = () => {
    if (!analysisResult) return;

    // 获取维度建议，确保是数组
    const criteriaTips = (analysisResult.criteria || [])
      .filter((c) => !c.passed && c.suggestion)
      .map((c) => formatSuggestionForMarkdown(c.suggestion!));

    // 获取全局建议，确保是数组
    const globalTips = (analysisResult.suggestions || [])
      .map(formatSuggestionForMarkdown);

    // 构建 Markdown 内容
    const markdownContent = [
      ...criteriaTips,
      ...globalTips,
    ].join('\n');

    // 复制到剪贴板
    navigator.clipboard
      .writeText(markdownContent)
      .then(() => toast.success(t("toast.copySuggestionSuccess")))
      .catch(() => toast.error(t("toast.copyFailed")));
  };

  return (
    <Drawer.Root
      dismissible={isDismissible}
      open={isOpen}
      onOpenChange={onClose}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 drawer-mask" />
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
              {isAnalyzing ? (
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
                  <div className="p-4 drawer-analysis-container rounded-xl">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2 items-start justify-between mb-4 last:mb-0">
                        <div className="flex items-start gap-2 w-[85%]">
                          <div className="h-4 w-4 drawer-skeleton rounded mt-0.5 flex-shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 drawer-skeleton rounded w-3/4" />
                            <div className="h-3 drawer-skeleton rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-3 drawer-skeleton rounded w-12 flex-shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* 三条综合建议骨架 */}
                  <div className="mt-4 p-4 drawer-suggestion-container rounded-xl">
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
                    <div className="p-4 drawer-analysis-container rounded-xl mb-4">
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
                      <div className="p-4 mt-2 drawer-suggestion-container rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold drawer-suggestion-title">
                            {t("promptBooster.drawer.suggestionsTitle")}
                          </h4>
                          <button
                            className="text-sm font-semibold drawer-suggestion-copy hover:underline"
                            onClick={copyAllSuggestions}
                          >
                            {t("promptBooster.drawer.copyAll")}
                          </button>
                        </div>
                        <ul className="list-disc ps-5 drawer-suggestion-title space-y-1">
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
              <div className="mt-4 flex gap-2 justify-center">
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
                        className="px-4 py-2 text-sm button-confirm transition"
                        onClick={onLLMAnalyze}
                        disabled={isAnalyzing || !isActiveModelEnabled}
                      >
                        {isAnalyzing ? (
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
                  className="px-4 py-2 text-sm button-cancel transition"
                  onClick={() => {
                    if (analysisResult?.suggestions?.length || 
                        analysisResult?.criteria.some((c) => !c.passed && c.suggestion)) {
                      copyAllSuggestions();
                    }
                    onClose();
                  }}
                >
                  {t("common.buttons.close")}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};