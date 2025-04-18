import React, { useState, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

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
                // 2秒后重置复制状态
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('无法复制文本: ', err);
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
                <label className={`block text-sm font-medium mb-2 text-gray-400 dark:text-gray-300 ${labelClassName}`}>
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
                    className={`w-full p-3 border rounded-md outline-none transition-colors duration-200
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} 
            ${readOnly ? 'cursor-default' : ''}
            ${isHovered
                            ? 'border-gray-300 dark:border-gray-500'
                            : 'border-gray-200 dark:border-gray-600'
                        }
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
            ${className}`}
                />

                {/* 复制按钮 - 仅在悬停且有内容时显示 */}
                {isHovered && value.trim() && (
                    <button
                        className={`absolute top-2 right-2 p-2 rounded-md bg-white/50 bg-opacity-80 
                ${value.trim() ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}
                dark:bg-transparent dark:text-blue-400 dark:hover:bg-gray-500/50`}
                        onClick={handleCopy}
                        disabled={!value.trim()}
                        title={value.trim() ? "复制文本" : "没有可复制的内容"}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                )}
            </div>

            {/* 字符计数 */}
            {showCharCount && (
                <div className="mt-2 flex justify-end">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {maxLength ? `${value.length}/${maxLength}` : `${value.length} 字符`}
                    </span>
                </div>
            )}
        </div>
    );
};