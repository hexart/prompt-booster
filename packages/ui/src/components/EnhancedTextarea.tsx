import React, { useState, useRef } from 'react';
import { ActionButtons } from './ActionButtons';
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
  showCopyButton?: boolean;
  filename?: string;
  showDownloadMd?: boolean;
  showDownloadDocx?: boolean;
  buttonPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
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
  showCopyButton = true,
  filename = 'content',
  showDownloadMd = true,
  showDownloadDocx = true,
  buttonPosition = 'top-right',
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        <ActionButtons
          content={String(value || '')}
          filename={filename}
          showCopy={showCopyButton}
          showDownloadMd={showDownloadMd}
          showDownloadDocx={showDownloadDocx}
          position={buttonPosition}
          isHovered={isHovered}
          showOnHover={true}
        />
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