import React, { useState, useMemo, useEffect } from 'react';
import { Dialog } from '@prompt-booster/ui/components/Dialog';
import { usePrompt } from '@prompt-booster/core/prompt/hooks/usePrompt';
import { PromptGroup } from '@prompt-booster/core/prompt/models/prompt';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { Trash2Icon, ChevronsDownIcon, ChevronsUpIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROVIDER_USER_EDIT } from '@prompt-booster/core/prompt/services/promptService';
import { formatProviderModelName } from '../utils/displayUtils';
import { isRTL } from '../rtl';

interface PromptHistoryProps {
  onNavigateToEditor?: () => void;
}

// 处理"用户编辑"文本
export const getDisplayProviderName = (provider: string, t: (key: string) => string): string => {
  if (provider === PROVIDER_USER_EDIT) {
    return t('history.userEdit');
  }
  return provider;
};
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
  } = usePrompt();

  // 状态管理
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({});

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
      <div className="p-4 border rounded-lg shadow-2xs h-full listcard-container">
        <div className="p-8 text-center h-full items-center listcard-description">
          <p>{t('history.noHistory')}</p>
          <p className="text-sm mt-2">{t('history.noHistoryHint')}</p>
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
    <div className="flex flex-col h-full p-4 border rounded-lg secondary-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold title-secondary">{t('history.title')} ({sortedGroups.length})</h2>
        <div>
          <button
            onClick={handleClearHistoryClick}
            className="px-3 py-2 flex items-center gap-1 text-sm rounded-md button-danger"
          >
            <Trash2Icon size={15} />
            <span className="hidden sm:block">{t('history.clearHistory')}</span>
          </button>
        </div>
      </div>
      <div className="space-y-2 max-h-[1200px] overflow-y-auto pb-2">
        {sortedGroups.map((group) => {
          // 获取该组的所有版本
          const versions = getGroupVersions(group.id);
          // 获取最新版本
          const latestVersion = versions.find(v => v.number === group.currentVersionNumber) || versions[versions.length - 1];

          if (!latestVersion) return null; // 防止空版本

          return (
            <div key={group.id} className="border rounded-lg p-3 shadow-2xs hover:shadow-md listcard-container">
              <div className="flex justify-between items-center mb-2 hover:cursor-pointer listcard-title-container" onClick={() => toggleExpand(group.id)}>
                <div className="flex items-center gap-2 listcard-text-container">
                  <span className="text-sm listcard-description">
                    {formatTimestamp(group.updatedAt)}
                  </span>
                  {versions.length > 1 && (
                    <span className="px-2 py-0.5 text-xs rounded-full listcard-tag">
                      {t('history.versionsCount', { count: versions.length })}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center listcard-button-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(group.id);
                    }}
                    className="flex items-center gap-1 text-sm px-3 py-2 rounded-md button-secondary"
                  >
                    {expandedGroupId === group.id ? <ChevronsUpIcon size={15} /> : <ChevronsDownIcon size={15} />}
                    <span className="hidden md:block">{expandedGroupId === group.id ? t('history.collapse') : t('history.expand')}</span>
                  </button>

                  <button
                    onClick={() => handleLoadGroup(group)}
                    className="flex items-center gap-1 text-sm px-3 py-2 rounded-md button-secondary-load"
                  >
                    <RotateCcwIcon size={15} />
                    <span className="hidden md:block">{t('history.load')}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="flex items-center gap-1 text-sm px-3 py-2 rounded-md button-secondary-danger"
                  >
                    <Trash2Icon size={15} />
                    <span className="hidden md:block">{t('history.deleteGroup')}</span>
                  </button>
                </div>
              </div>

              {expandedGroupId === group.id && (
                <div className="space-y-3">
                  {/* 获取当前显示版本 */}
                  {(() => {
                    const displayVersion = versions.find(
                      version => version.number === getSelectedVersion(group.id, group.currentVersionNumber)
                    ) || latestVersion;

                    return (
                      <>
                        <div>
                          <h3 className="text-sm font-medium mb-1 listcard-description">{t('history.originalPrompt')}</h3>
                          <div className="p-2 max-h-32 overflow-y-scroll rounded-md text-sm whitespace-pre-wrap listcard-prompt-container">
                            {group.originalPrompt}
                          </div>
                        </div>

                        {/* 版本列表 */}
                        <div className="flex gap-2 overflow-y-visible overflow-x-auto py-2 [&::-webkit-scrollbar]:h-1">
                          {versions.map(version => (
                            <Tooltip key={version.id}
                              text={version.provider === PROVIDER_USER_EDIT
                                ? getDisplayProviderName(version.provider, t)
                                : `${t('history.usingModel')}\n${formatProviderModelName(
                                  getDisplayProviderName(version.provider, t),
                                  version.modelName,
                                  currentIsRTL
                                )}`
                              }
                            >
                              <button
                                key={version.id}
                                onClick={() => handleSelectVersion(group.id, version.number)}
                                className={`px-2 py-1 text-xs min-w-[32px] rounded-full ${version.number === getSelectedVersion(group.id, group.currentVersionNumber)
                                  ? 'version-tag-active'
                                  : 'version-tag-inactive'
                                  }`}
                              >
                                v{version.number}
                              </button>
                            </Tooltip>
                          ))}
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-1 listcard-description">{t('history.iterationDirection')}</h3>
                          <div className="p-2 rounded-md text-sm whitespace-pre-wrap iteration-prompt-container">
                            {displayVersion.iterationDirection
                              ? getDisplayProviderName(displayVersion.iterationDirection, t)
                              : t('history.initialVersion')
                            }
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-1 listcard-description">{t('history.enhancedPrompt')}</h3>
                          <div className="p-2 max-h-[460px] overflow-auto rounded-md text-sm listcard-prompt-container">
                            {displayVersion.optimizedPrompt || ''}
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                          {/* 加载当前版本按钮 */}
                          <button
                            onClick={() => handleLoadVersion(
                              group.id,
                              getSelectedVersion(group.id, group.currentVersionNumber)
                            )}
                            className="text-sm px-3 py-2 rounded-md button-secondary-load-version"
                          >
                            {t('history.loadVersion')}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 未展开时只显示原始提示词 */}
              {expandedGroupId !== group.id && (
                <div className="truncate text-sm font-medium mb-1 listcard-description">
                  {t('history.originalPrompt')} {truncateText(group.originalPrompt)}
                </div>
              )}
            </div>
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
            <button
              onClick={cancelClearHistory}
              className="px-4 py-2 rounded-md button-cancel"
            >
              {t('common.buttons.cancel')}
            </button>
            <button
              onClick={confirmClearHistory}
              className="px-4 py-2 rounded-md button-danger"
            >
              {t('history.confirmClearButton')}
            </button>
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
            <button
              onClick={cancelDeleteHistoryItem}
              className="px-4 py-2 rounded-md button-cancel"
            >
              {t('common.buttons.cancel')}
            </button>
            <button
              onClick={confirmDeleteHistoryItem}
              className="px-4 py-2 rounded-md button-danger"
            >
              {t('history.confirmDeleteButton')}
            </button>
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