// packages/ui/src/components/ActionButtons.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardIcon, ClipboardCheckIcon, FileTypeIcon, FileTextIcon, FileCheck2Icon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
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

  // 翻译文本
  labels?: {
    copy?: string;
    downloadMd?: string;
    downloadDocx?: string;
    copySuccess?: string;
    copyFailed?: string;
    downloadSuccess?: string;
    downloadFailed?: string;
  };
}

// 单个按钮的动画配置 - 移除了 visible 状态的 transition
const buttonVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeInOut" as const
    }
  },
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

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
  labels = {},
}) => {
  // 使用提供的labels或默认值
  const {
    copy = 'Copy',
    downloadMd = 'Download MD',
    downloadDocx = 'Download DOCX',
    copySuccess = 'Copy Success',
    copyFailed = 'Copy Failed',
    downloadSuccess = 'Download Success',
    downloadFailed = 'Download Failed',
  } = labels;
  const [copied, setCopied] = useState(false);
  const [downloadedMd, setDownloadedMd] = useState(false);
  const [downloadedDocx, setDownloadedDocx] = useState(false);
  const [downloading, setDownloading] = useState<'md' | 'docx' | null>(null);

  // 检查是否有内容
  const hasContent = content && content.trim() !== '';

  // 决定是否显示按钮组
  const shouldShow = hasContent && (!showOnHover || isHovered) && !streaming;

  function removeThinkTags(text: string): string {
    if (!text) return text;
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  // 处理复制
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasContent) return;

    try {
      const cleanedContent = removeThinkTags(content);
      await navigator.clipboard.writeText(cleanedContent);
      setCopied(true);
      toast.success(copySuccess);
      onCopy?.();

      // 2秒后重置状态
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(copyFailed, err);
      toast.error(copyFailed);
    }
  };

  // 处理下载MD
  const handleDownloadMd = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasContent) return;

    try {
      setDownloading('md');

      const cleanedContent = removeThinkTags(content);
      // 创建Blob
      const blob = new Blob([cleanedContent], { type: 'text/markdown;charset=utf-8' });

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

      // 显示成功状态
      setDownloadedMd(true);
      toast.success(downloadSuccess);
      onDownload?.('md', finalFilename);

      // 2秒后重置状态
      setTimeout(() => setDownloadedMd(false), 2000);
    } catch (err) {
      console.error('Download MD failed:', err);
      toast.error(downloadFailed);
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

      const cleanedContent = removeThinkTags(content);
      // 使用 @mohtasham/md-to-docx 转换
      const blob = await convertMarkdownToDocx(cleanedContent, {
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

      // 显示成功状态
      setDownloadedDocx(true);
      toast.success(downloadSuccess);
      onDownload?.('docx', finalFilename);

      // 2秒后重置状态
      setTimeout(() => setDownloadedDocx(false), 2000);
    } catch (err) {
      console.error('Download DOCX failed:', err);
      toast.error(downloadFailed);
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

  // 构建要显示的按钮数组
  const buttons = [];

  if (showCopy) {
    buttons.push({
      key: 'copy',
      component: (
        <Tooltip text={copy} position="bottom">
          <motion.button
            className="p-2 rounded-md input-copy-button"
            onClick={handleCopy}
            disabled={!hasContent}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {copied ? <ClipboardCheckIcon size={16} /> : <ClipboardIcon size={16} />}
          </motion.button>
        </Tooltip>
      )
    });
  }

  if (showDownloadMd) {
    buttons.push({
      key: 'downloadMd',
      component: (
        <Tooltip text={downloadMd} position="bottom">
          <motion.button
            className="p-2 rounded-md input-copy-button"
            onClick={handleDownloadMd}
            disabled={!hasContent || downloading === 'md'}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {downloading === 'md' ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : downloadedMd ? (
              <FileCheck2Icon size={16} />
            ) : (
              <FileTypeIcon size={16} />
            )}
          </motion.button>
        </Tooltip>
      )
    });
  }

  if (showDownloadDocx) {
    buttons.push({
      key: 'downloadDocx',
      component: (
        <Tooltip text={downloadDocx} position="bottom">
          <motion.button
            className="p-2 rounded-md input-copy-button"
            onClick={handleDownloadDocx}
            disabled={!hasContent || downloading === 'docx'}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {downloading === 'docx' ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : downloadedDocx ? (
              <FileCheck2Icon size={16} />
            ) : (
              <FileTextIcon size={16} />
            )}
          </motion.button>
        </Tooltip>
      )
    });
  }

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          className={`${positionClass} flex items-center gap-1 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {buttons.map((button, index) => (
            <motion.div
              key={button.key}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                delay: index * 0.1,
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.4
              }}
            >
              {button.component}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};