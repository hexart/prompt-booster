import React, { useState, useRef } from 'react';
import { ClipboardIcon, ClipboardCheckIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EnhancedTextareaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    disabled?: boolean;
    label?: string;
    labelClassName?: string;
    readOnly?: boolean;
    maxLength?: number;
    minHeight?: string;
    showCharCount?: boolean;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
    value,
    onChange,
    placeholder = '请输入...',
    className = '',
    rows = 5,
    disabled = false,
    label,
    labelClassName = '',
    readOnly = false,
    maxLength,
    minHeight,
    showCharCount = false,
}) => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 处理文本复制
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!value.trim()) return; // 如果没有内容则不复制

        // 复制文本到剪贴板
        navigator.clipboard.writeText(value)
            .then(() => {
                setCopied(true);
                toast.success(t('toast.copySuccess'));
                // 2秒后重置复制状态
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error(t('toast.copyFailed'), err);
            });
    };

    // 父容器样式
    const containerStyle: React.CSSProperties = {
        position: 'relative',
        ...(minHeight ? { minHeight } : {})
    };

    return (
        <div className="w-full">
            {label && (
                <label className={`block text-sm font-medium mb-2 ${labelClassName}`}>
                    {label}
                </label>
            )}

            <div
                style={containerStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    readOnly={readOnly}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    rows={rows}
                    className={`w-full p-3 border rounded-md outline-none transition-colors duration-200 ${className}
            ${disabled ? 'cursor-not-allowed' : ''} 
            ${readOnly ? 'cursor-default' : ''}
            ${isHovered
                            ? 'autoscroll-border-hover'
                            : 'autoscroll-border'
                        }
            `}
                />

                {/* 复制按钮 - 仅在悬停且有内容时显示 */}
                {isHovered && value.trim() && (
                    <Tooltip text={t('common.buttons.copy')} position="bottom">
                        <button
                            className="absolute top-2 right-2 p-2 rounded-md input-copy-button"
                            onClick={handleCopy}
                        >
                            {copied ? <ClipboardCheckIcon size={16} /> : <ClipboardIcon size={16} />}
                        </button>
                    </Tooltip>
                )}
            </div>

            {/* 字符计数 */}
            {showCharCount && (
                <div className="mt-2 flex justify-end">
                    <span className="text-sm input-charactor-counter">
                        {maxLength
                            ? `${value.length}/${maxLength}`
                            : t('promptBooster.characterCount', { count: Number(value.length) })
                        }
                    </span>
                </div>
            )}
        </div>
    );
};