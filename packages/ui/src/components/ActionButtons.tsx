// packages/ui/src/components/ActionButtons.tsx
import React, { useState } from 'react';
import { ClipboardIcon, ClipboardCheckIcon, DownloadIcon, FileTextIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { convertMarkdownToDocx } from '@mohtasham/md-to-docx';

/**
 * 统一的操作按钮组件
 * 
 * 提供复制、下载MD、下载DOCX等功能
 */
interface ActionButtonsProps {
    // 内容文本
    content: string;
    
    // 文件名前缀，不包含扩展名
    filename?: string;
    
    // 是否显示复制按钮
    showCopy?: boolean;
    
    // 是否显示下载MD按钮
    showDownloadMd?: boolean;
    
    // 是否显示下载DOCX按钮
    showDownloadDocx?: boolean;
    
    // 按钮位置
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
    
    // 是否在悬停时显示
    showOnHover?: boolean;
    
    // 外部控制的悬停状态
    isHovered?: boolean;
    
    // 是否正在流式输出（流式时不显示下载按钮）
    streaming?: boolean;
    
    // 自定义CSS类名
    className?: string;
    
    // 复制成功回调
    onCopy?: () => void;
    
    // 下载成功回调
    onDownload?: (type: 'md' | 'docx', filename: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    content,
    filename = 'document',
    showCopy = true,
    showDownloadMd = true,
    showDownloadDocx = true,
    position = 'top-right',
    showOnHover = true,
    isHovered = false,
    streaming = false,
    className = '',
    onCopy,
    onDownload,
}) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState<'md' | 'docx' | null>(null);

    // 检查是否有内容
    const hasContent = content && content.trim() !== '';

    // 决定是否显示按钮组
    const shouldShow = hasContent && (!showOnHover || isHovered) && !streaming;

    if (!shouldShow) {
        return null;
    }

    // 处理复制
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!hasContent) return;

        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success(t('toast.copySuccess'));
            onCopy?.();
            
            // 2秒后重置状态
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error(t('toast.copyFailed'), err);
            toast.error(t('toast.copyFailed'));
        }
    };

    // 处理下载MD
    const handleDownloadMd = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!hasContent) return;

        try {
            setDownloading('md');
            
            // 创建Blob
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const finalFilename = `${filename}-${Date.now()}.md`;
            
            link.href = url;
            link.download = finalFilename;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success(t('toast.downloadSuccess'));
            onDownload?.('md', finalFilename);
        } catch (err) {
            console.error('Download MD failed:', err);
            toast.error(t('toast.downloadFailed'));
        } finally {
            setDownloading(null);
        }
    };

    // 处理下载DOCX
    const handleDownloadDocx = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!hasContent) return;

        try {
            setDownloading('docx');
            
            // 使用 @mohtasham/md-to-docx 转换
            const blob = await convertMarkdownToDocx(content, {
                documentType: 'document',
                style: {
                    titleSize: 48,
                    headingSpacing: 240,
                    paragraphSpacing: 200,
                    lineSpacing: 1.15,
                    heading1Size: 36,
                    heading2Size: 32,
                    heading3Size: 30,
                    heading4Size: 28,
                    heading5Size: 26,
                    paragraphSize: 24,
                    listItemSize: 24,
                    codeBlockSize: 22,
                    blockquoteSize: 22,
                }
            });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const finalFilename = `${filename}-${Date.now()}.docx`;
            
            link.href = url;
            link.download = finalFilename;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success(t('toast.downloadSuccess'));
            onDownload?.('docx', finalFilename);
        } catch (err) {
            console.error('Download DOCX failed:', err);
            toast.error(t('toast.downloadFailed'));
        } finally {
            setDownloading(null);
        }
    };

    // 按钮位置样式
    const getPositionClass = (pos: string) => {
        switch (pos) {
            case 'top-right':
                return 'absolute top-2 right-2';
            case 'bottom-right':
                return 'absolute bottom-2 right-2';
            case 'top-left':
                return 'absolute top-2 left-2';
            case 'bottom-left':
                return 'absolute bottom-2 left-2';
            default:
                return 'absolute top-2 right-2';
        }
    };

    const positionClass = getPositionClass(position);

    return (
        <div className={`${positionClass} flex items-center gap-1 ${className}`}>
            {/* 复制按钮 */}
            {showCopy && (
                <Tooltip text={t('common.buttons.copy')} position="bottom">
                    <button
                        className="p-2 rounded-md input-copy-button"
                        onClick={handleCopy}
                        disabled={!hasContent}
                    >
                        {copied ? <ClipboardCheckIcon size={16} /> : <ClipboardIcon size={16} />}
                    </button>
                </Tooltip>
            )}

            {/* 下载MD按钮 */}
            {showDownloadMd && (
                <Tooltip text={t('common.buttons.downloadMd', { defaultValue: 'Download MD' })} position="bottom">
                    <button
                        className="p-2 rounded-md input-copy-button"
                        onClick={handleDownloadMd}
                        disabled={!hasContent || downloading === 'md'}
                    >
                        {downloading === 'md' ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <FileTextIcon size={16} />
                        )}
                    </button>
                </Tooltip>
            )}

            {/* 下载DOCX按钮 */}
            {showDownloadDocx && (
                <Tooltip text={t('common.buttons.downloadDocx', { defaultValue: 'Download DOCX' })} position="bottom">
                    <button
                        className="p-2 rounded-md input-copy-button"
                        onClick={handleDownloadDocx}
                        disabled={!hasContent || downloading === 'docx'}
                    >
                        {downloading === 'docx' ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <DownloadIcon size={16} />
                        )}
                    </button>
                </Tooltip>
            )}
        </div>
    );
};