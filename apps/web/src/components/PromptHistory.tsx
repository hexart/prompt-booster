import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from './ui/components/Dialog';
import { usePromptManager } from '~/hooks';
import { PromptGroup } from '~/core/prompt/models/prompt';
import { Tooltip, ActionButtons, AnimatedButton } from './ui/components';
import { GalleryVerticalEndIcon, Trash2Icon, ChevronsDownIcon, ChevronsUpIcon, ZapIcon, ClockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROVIDER_USER_EDIT } from '~/core/prompt/services/promptService';
import { isRTL } from '../rtl';
import { getVersionTooltipText } from '../utils/displayUtils';

interface PromptHistoryProps {
  onNavigateToEditor?: () => void;
}


export const PromptHistory: React.FC<PromptHistoryProps> = ({ onNavigateToEditor }) => {
  const { t, i18n } = useTranslation();
  const [currentIsRTL, setCurrentIsRTL] = useState(isRTL());

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIsRTL(isRTL());
    }, 10);
    return () => clearTimeout(timer);
  }, [i18n.language]);

  // 使用新的 usePrompt hook
  const {
    groups,
    getGroupVersions,
    deleteGroup,
    loadFromHistory
  } = usePromptManager();

  // 状态管理
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({});
  const [hoveredContainer, setHoveredContainer] = useState<string | null>(null);

  // 获取所有组（已排序）
  const sortedGroups = useMemo(() => {
    return groups.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [groups]);

  // 获取当前显示的版本
  const getSelectedVersion = (groupId: string, defaultVersion: number) => {
    return selectedVersions[groupId] || defaultVersion;
  };

  // 删除对话框相关状态
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [deleteDialogInfo, setDeleteDialogInfo] = useState<{ isOpen: boolean; groupId: string }>({
    isOpen: false,
    groupId: ''
  });

  if (sortedGroups.length === 0) {
    return (
      <div className="p-4 border rounded-xl shadow-2xs h-full secondary-container">
        <div className="p-8 flex flex-col justify-center text-center h-full">
          <motion.p
            className='flex justify-center mb-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.1
            }}
          >
            <ClockIcon size={32} className='input-description' strokeWidth={1} />
          </motion.p>
          <motion.p
            className='input-description'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.2
            }}
          >
            {t('history.noHistory')}
          </motion.p>
          <motion.p
            className="text-xs mt-2 input-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.3
            }}
          >{t('history.noHistoryHint')}
          </motion.p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleClearHistoryClick = () => {
    setIsClearDialogOpen(true);
  };

  const confirmClearHistory = () => {
    // 逐个删除所有组
    sortedGroups.forEach(group => {
      deleteGroup(group.id);
    });
    setIsClearDialogOpen(false);
  };

  const cancelClearHistory = () => {
    setIsClearDialogOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setDeleteDialogInfo({
      isOpen: true,
      groupId
    });
  };

  // 确认删除
  const confirmDeleteHistoryItem = () => {
    const groupId = deleteDialogInfo.groupId;
    deleteGroup(groupId);
    setDeleteDialogInfo({
      isOpen: false,
      groupId: ''
    });
  };

  const cancelDeleteHistoryItem = () => {
    setDeleteDialogInfo({
      isOpen: false,
      groupId: ''
    });
  };

  const handleLoadGroup = (group: PromptGroup) => {
    loadFromHistory(group.id, group.currentVersionNumber);
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  const handleLoadVersion = (groupId: string, versionNumber: number) => {
    loadFromHistory(groupId, versionNumber);
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  // 切换展开/收起
  const toggleExpand = (groupId: string) => {
    setExpandedGroupId(prev => prev === groupId ? null : groupId);
  };

  // 选择版本
  const handleSelectVersion = (groupId: string, version: number) => {
    setSelectedVersions(prev => ({
      ...prev,
      [groupId]: version
    }));
  };

  return (
    <div className="flex flex-col h-full p-4 border rounded-xl secondary-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold title-secondary"><GalleryVerticalEndIcon size={20} />{t('history.title')} ({sortedGroups.length})</h2>
        <div>
          <AnimatedButton
            onClick={handleClearHistoryClick}
            className="px-3 py-2 flex items-center gap-1 text-sm button-danger"
          >
            <Trash2Icon size={15} />
            <span className="hidden sm:block">{t('history.clearHistory')}</span>
          </AnimatedButton>
        </div>
      </div>
      <div className="space-y-2 h-full overflow-y-scroll">
        {sortedGroups.map((group, index) => {
          // 获取该组的所有版本
          const versions = getGroupVersions(group.id);
          // 获取最新版本
          const latestVersion = versions.find(v => v.number === group.currentVersionNumber) || versions[versions.length - 1];

          if (!latestVersion) return null; // 防止空版本

          return (
            <motion.div key={group.id} className="border rounded-lg p-3 shadow-2xs hover:shadow-md listcard-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeOut"
              }}>
              <div className="flex justify-between items-center hover:cursor-pointer listcard-title-container" onClick={() => toggleExpand(group.id)}>
                <div className="flex-col grow w-1/2 min-w-[33%] pe-4 items-center space-y-2 listcard-text-container">
                  <div className="flex items-center gap-2">
                    <span className="text-sm listcard-description">
                      {formatTimestamp(group.updatedAt)}
                    </span>
                    {versions.length > 1 && (
                      <>
                        {/* sm屏幕以下显示简化版本 */}
                        <span className="px-2 py-0.5 text-xs rounded-full listcard-tag sm:hidden">
                          {versions.length}
                        </span>
                        {/* sm屏幕以上显示完整版本 */}
                        <span className="px-2 py-0.5 text-xs rounded-full listcard-tag hidden sm:inline">
                          {t('history.versionsCount', { count: versions.length })}
                        </span>
                      </>
                    )}
                  </div>

                  {/* 未展开时只显示原始提示词 */}
                  <h3 className="truncate text-sm font-medium mb-1 listcard-description">
                    {t('history.originalPrompt')}: {expandedGroupId !== group.id && truncateText(group.originalPrompt)}
                  </h3>
                </div>
                <div className="flex gap-2 items-center listcard-button-container">
                  <AnimatedButton
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(group.id);
                    }}
                    className="hidden items-center gap-1 text-sm px-3 py-2 button-secondary"
                  >
                    {expandedGroupId === group.id ? <ChevronsUpIcon size={15} /> : <ChevronsDownIcon size={15} />}
                    <span className="hidden md:block">{expandedGroupId === group.id ? t('history.collapse') : t('history.expand')}</span>
                  </AnimatedButton>

                  <AnimatedButton
                    onClick={(e) => {
                      handleLoadGroup(group);
                      e.stopPropagation()
                    }}
                    className="flex items-center gap-1 text-sm px-3 py-2 button-secondary-load"
                  >
                    <ZapIcon size={15} />
                    <span className="hidden md:block">{t('history.load')}</span>
                  </AnimatedButton>

                  <AnimatedButton
                    onClick={(e) => {
                      handleDeleteGroup(group.id);
                      e.stopPropagation();
                    }}
                    className="flex items-center gap-1 text-sm px-3 py-2 button-secondary-danger"
                  >
                    <Trash2Icon size={15} />
                    <span className="hidden md:block">{t('history.deleteGroup')}</span>
                  </AnimatedButton>
                </div>
              </div>

              <AnimatePresence>
                {expandedGroupId === group.id && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                      height: { duration: 0.4 }
                    }}
                    style={{ overflow: "hidden" }}
                  >
                    {/* 现有的所有展开内容保持不变 */}
                    {(() => {
                      const displayVersion = versions.find(
                        version => version.number === getSelectedVersion(group.id, group.currentVersionNumber)
                      ) || latestVersion;

                      return (
                        <>
                          <div className="relative mt-1 p-1 py-2 rounded-md listcard-prompt-container"
                            onMouseEnter={() => setHoveredContainer(`${group.id}-original`)}
                            onMouseLeave={() => setHoveredContainer(null)}>
                            <div className="p-2 max-h-32 overflow-y-scroll text-sm whitespace-pre-wrap">
                              {group.originalPrompt}
                            </div>
                            <ActionButtons
                              content={group.originalPrompt}
                              filename={t('history.originalPrompt')}
                              position="top-right"
                              isHovered={hoveredContainer === `${group.id}-original`}
                              showOnHover={true}
                              showDownloadDocx={false}
                            />
                          </div>

                          {/* 版本列表 */}
                          <div className="flex gap-2 overflow-y-visible overflow-x-auto px-1 py-2 [&::-webkit-scrollbar]:h-1">
                            {versions.map(version => (
                              <Tooltip key={version.id}
                                text={getVersionTooltipText(version, t, currentIsRTL)}
                              >
                                <AnimatedButton
                                  key={version.id}
                                  onClick={() => handleSelectVersion(group.id, version.number)}
                                  className={`px-2 py-1 text-xs min-w-[32px] rounded-full ${version.number === getSelectedVersion(group.id, group.currentVersionNumber)
                                    ? 'version-tag-active'
                                    : 'version-tag-inactive'
                                    }`}
                                >
                                  v{version.number}
                                </AnimatedButton>
                              </Tooltip>
                            ))}
                          </div>

                          <h3 className="text-sm font-medium mb-1 listcard-description">{t('history.iterationDirection')}: </h3>
                          <div className="relative p-1 py-2 rounded-md iteration-prompt-container"
                            onMouseEnter={() => setHoveredContainer(`${group.id}-iteration`)}
                            onMouseLeave={() => setHoveredContainer(null)}>
                            <div className="p-2 max-h-[260px] text-sm whitespace-pre-wrap">
                              {displayVersion.iterationDirection
                                ? (displayVersion.iterationDirection === PROVIDER_USER_EDIT
                                  ? t('history.userEdit')
                                  : displayVersion.iterationDirection)
                                : t('history.initialVersion')
                              }
                            </div>
                            <ActionButtons
                              content={displayVersion.iterationDirection || t('history.initialVersion')}
                              filename={`${t('history.iterationDirection')}-v${displayVersion.number}`}
                              position="top-right"
                              isHovered={hoveredContainer === `${group.id}-iteration`}
                              showOnHover={true}
                              showDownloadDocx={false}
                            />
                          </div>

                          <h3 className="text-sm font-medium mb-1 listcard-description">{t('history.enhancedPrompt')}: </h3>
                          <div className="relative p-1 rounded-md listcard-prompt-container"
                            onMouseEnter={() => setHoveredContainer(`${group.id}-optimized`)}
                            onMouseLeave={() => setHoveredContainer(null)}>
                            <div className="p-2 max-h-[460px] md:max-h-[360px] overflow-auto text-sm">
                              {displayVersion.optimizedPrompt || ''}
                            </div>
                            <ActionButtons
                              content={displayVersion.optimizedPrompt || ''}
                              filename={`${t('history.enhancedPrompt')}-v${displayVersion.number}`}
                              position="top-right"
                              isHovered={hoveredContainer === `${group.id}-optimized`}
                              showOnHover={true}
                              showDownloadDocx={false}
                            />
                          </div>

                          <div className="mt-3 flex justify-end gap-2">
                            {/* 加载当前版本按钮 */}
                            <AnimatedButton
                              onClick={() => handleLoadVersion(
                                group.id,
                                getSelectedVersion(group.id, group.currentVersionNumber)
                              )}
                              className="text-sm px-3 py-2 button-secondary-load-version"
                            >
                              {t('history.loadVersion')}
                            </AnimatedButton>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 清空历史确认对话框 */}
      <Dialog
        isOpen={isClearDialogOpen}
        onClose={cancelClearHistory}
        title={t('history.confirmClearTitle')}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <AnimatedButton
              onClick={cancelClearHistory}
              className="px-4 py-2 button-cancel"
            >
              {t('common.buttons.cancel')}
            </AnimatedButton>
            <AnimatedButton
              onClick={confirmClearHistory}
              className="px-4 py-2 button-danger"
            >
              {t('history.confirmClearButton')}
            </AnimatedButton>
          </div>
        }
      >
        <p>{t('history.confirmClearMsg')}</p>
      </Dialog>

      {/* 删除提示词组确认对话框 */}
      <Dialog
        isOpen={deleteDialogInfo.isOpen}
        onClose={cancelDeleteHistoryItem}
        title={t('history.confirmDeleteTitle')}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <AnimatedButton
              onClick={cancelDeleteHistoryItem}
              className="px-4 py-2 button-cancel"
            >
              {t('common.buttons.cancel')}
            </AnimatedButton>
            <AnimatedButton
              onClick={confirmDeleteHistoryItem}
              className="px-4 py-2 button-danger"
            >
              {t('history.confirmDeleteButton')}
            </AnimatedButton>
          </div>
        }
      >
        <p>
          {t('history.confirmDeleteMsg')}
        </p>
      </Dialog>
    </div>
  );
};