import React, { useState, useMemo } from 'react';
import { Dialog } from '@prompt-booster/ui/components/Dialog';
import { usePromptGroup } from '@prompt-booster/core/prompt/hooks/usePrompt';
import { PromptGroup } from '@prompt-booster/core/prompt/models/prompt';
import { usePromptHistory } from '@prompt-booster/core/prompt/hooks/usePromptHistory';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { Trash2Icon, ChevronsDownIcon, ChevronsUpIcon, RotateCcwIcon } from 'lucide-react';

interface PromptHistoryProps {
    onNavigateToEditor?: () => void;
}

export const PromptHistory: React.FC<PromptHistoryProps> = ({ onNavigateToEditor }) => {
    // 使用提示词组钩子
    const {
        getAllGroups,
        getGroupVersions,
        deleteGroup,
    } = usePromptGroup();

    // 使用新的历史记录钩子
    const {
        expandedGroupId,
        selectedVersions,
        toggleExpand,
        handleSelectVersion,
        loadGroup,
        loadVersion
    } = usePromptHistory();

    // 获取所有组
    const groups = useMemo(() => {
        return getAllGroups().sort((a, b) => b.updatedAt - a.updatedAt);
    }, [getAllGroups]);

    // 获取当前显示的版本
    const getSelectedVersion = (groupId: string, defaultVersion: number) => {
        return selectedVersions[groupId] || defaultVersion;
    };

    // 添加一个状态来区分删除类型
    const [_deleteType, setDeleteType] = useState<'group'>('group');

    // 删除对话框相关状态和函数
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [deleteDialogInfo, setDeleteDialogInfo] = useState<{ isOpen: boolean; groupId: string }>({
        isOpen: false,
        groupId: ''
    });

    if (groups.length === 0) {
        return (
            <div className="p-4 border rounded-lg shadow-2xs h-full listcard-container">
                <div className="p-8 text-center h-full items-center listcard-description">
                    <p>暂无优化历史记录</p>
                    <p className="text-sm mt-2">优化提示词后将在此处显示历史记录</p>
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
        groups.forEach(group => {
            deleteGroup(group.id);
        });
        setIsClearDialogOpen(false);
    };

    const cancelClearHistory = () => {
        setIsClearDialogOpen(false);
    };

    const handleDeleteGroup = (groupId: string) => {
        setDeleteType('group');
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
        loadGroup(group, onNavigateToEditor);
    };

    return (
        <div className="flex flex-col h-full p-4 border rounded-lg secondary-container">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold title-secondary">历史记录 ({groups.length})</h2>
                <div>
                    <button
                        onClick={handleClearHistoryClick}
                        className="px-3 py-2 flex items-center gap-1 text-sm rounded-md button-danger"
                    >
                        <Trash2Icon size={15} />
                        <span className="hidden sm:block">清空</span>
                    </button>
                </div>
            </div>
            <div className="space-y-2 max-h-[1200px] overflow-y-auto pb-2">
                {groups.map((group) => {
                    // 获取该组的所有版本
                    const versions = getGroupVersions(group.id);
                    // 获取最新版本
                    const latestVersion = versions.find(v => v.number === group.currentVersionNumber) || versions[versions.length - 1];

                    if (!latestVersion) return null; // 防止空版本

                    return (
                        <div key={group.id} className="border rounded-lg p-3 shadow-2xs hover:shadow-md listcard-container">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm listcard-description">
                                        {formatTimestamp(group.updatedAt)}
                                    </span>
                                    {versions.length > 1 && (
                                        <span className="px-2 py-0.5 text-xs rounded-full listcard-tag">
                                            {versions.length}个版本
                                        </span>
                                    )}
                                </div>
                                <div className="flex space-x-2 items-center">
                                    <button
                                        onClick={() => toggleExpand(group.id)}
                                        className="flex items-center gap-1 text-sm px-3 py-2 rounded-md button-secondary"
                                    >
                                        {expandedGroupId === group.id ? <ChevronsUpIcon size={15} /> : <ChevronsDownIcon size={15} />}
                                        <span className="hidden md:block">{expandedGroupId === group.id ? '收起' : '展开'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleLoadGroup(group)}
                                        className="flex items-center gap-1 text-sm px-3 py-2 rounded-md button-secondary-load"
                                    >
                                        <RotateCcwIcon size={15} />
                                        <span className="hidden md:block">加载</span>
                                    </button>

                                    <button
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="flex items-center gap-1 text-sm px-3 py-2 rounded-md button-secondary-danger"
                                    >
                                        <Trash2Icon size={15} />
                                        <span className="hidden md:block">删除组</span>
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
                                                    <h3 className="text-sm font-medium mb-1 listcard-description">原始提示词：</h3>
                                                    <div className="p-2 max-h-32 overflow-y-scroll rounded-md text-sm whitespace-pre-wrap listcard-prompt-container">
                                                        {group.originalPrompt}
                                                    </div>
                                                </div>

                                                {/* 版本列表 */}
                                                <div className="flex space-x-2 overflow-y-visible overflow-x-auto py-2 [&::-webkit-scrollbar]:h-1">
                                                    {versions.map(version => (
                                                        <Tooltip key={version.id} text={`使用模型：\n${version.provider ? `${version.provider} - ` : ''}${version.modelName || version.modelId || '未知模型'}`}>
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
                                                    <h3 className="text-sm font-medium mb-1 listcard-description">迭代方向：</h3>
                                                    <div className="p-2 rounded-md text-sm whitespace-pre-wrap iteration-prompt-container">
                                                        {displayVersion.iterationDirection || "无"}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-medium mb-1 listcard-description">增强后提示词：</h3>
                                                    <div className="p-2 max-h-[460px] overflow-auto rounded-md text-sm listcard-prompt-container">
                                                        {displayVersion.optimizedPrompt || ''}
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex justify-end gap-2">
                                                    {/* 加载当前版本按钮 */}
                                                    <button
                                                        onClick={() => {
                                                            loadVersion(
                                                                group.id,
                                                                getSelectedVersion(group.id, group.currentVersionNumber),
                                                                onNavigateToEditor
                                                            );
                                                        }}
                                                        className="text-sm px-3 py-2 rounded-md button-secondary-load-version"
                                                    >
                                                        加载此版本
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* 未展开时只显示原始提示词 */}
                            {expandedGroupId !== group.id && (
                                <div>
                                    <div className="text-sm font-medium mb-1 listcard-description">原始提示词：</div>
                                    <div className="truncate p-2 text-sm listcard-description">
                                        {truncateText(group.originalPrompt)}
                                    </div>
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
                title="确认清空历史"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={cancelClearHistory}
                            className="px-4 py-2 rounded-md button-cancel"
                        >
                            取消
                        </button>
                        <button
                            onClick={confirmClearHistory}
                            className="px-4 py-2 rounded-md button-danger"
                        >
                            确认清空
                        </button>
                    </div>
                }
            >
                <p>确定要清空所有历史记录吗？此操作不可撤销。</p>
            </Dialog>

            {/* 删除提示词组确认对话框 */}
            <Dialog
                isOpen={deleteDialogInfo.isOpen}
                onClose={cancelDeleteHistoryItem}
                title="确认删除整组提示词"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={cancelDeleteHistoryItem}
                            className="px-4 py-2 rounded-md button-cancel"
                        >
                            取消
                        </button>
                        <button
                            onClick={confirmDeleteHistoryItem}
                            className="px-4 py-2 rounded-md button-danger"
                        >
                            确认删除
                        </button>
                    </div>
                }
            >
                <p>
                    确定要删除这组提示词的所有版本吗？此操作不可撤销。
                </p>
            </Dialog>
        </div>
    );
};