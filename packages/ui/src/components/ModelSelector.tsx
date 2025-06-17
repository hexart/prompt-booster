// packages/ui/src/components/ModelSelectorNew.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../index';
import { DialogContext } from './Dialog';
import LoadingIcon from './LoadingIcon';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ModelOption {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  fetchModels: () => Promise<ModelOption[]>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFetch?: (options: ModelOption[]) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  fetchModels,
  placeholder = '选择或输入模型名称',
  className = '',
  disabled = false,
  onFetch
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { containerRef: dialogContainerRef } = useContext(DialogContext);
  // 定义 ref 来存储滚动位置和上次滚动的值
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const lastScrolledValueRef = useRef<string | null>(null);
  const hasScrolledToSelectedRef = useRef<boolean>(false);
  const lastFilterTextRef = useRef<string>('');
  const lastFilteredOptionsCountRef = useRef<number>(0);

  // 当菜单打开时，滚动到选中的选项
  useEffect(() => {
    if (isOpen && !isLoading && selectedOptionRef.current && optionsContainerRef.current) {
      // 检查筛选条件是否变化
      const filterChanged =
        inputValue !== lastFilterTextRef.current ||
        filteredOptions.length !== lastFilteredOptionsCountRef.current;

      // 检查是否需要滚动到选中项
      const needsToScrollToSelected =
        value !== lastScrolledValueRef.current ||
        !hasScrolledToSelectedRef.current ||
        filterChanged;

      if (needsToScrollToSelected && selectedOptionRef.current) {
        const element = selectedOptionRef.current;
        const container = optionsContainerRef.current;
        const extraPadding = 6; // 额外的间距

        // 先滚动到选中项
        element.scrollIntoView({
          block: 'nearest',
          behavior: 'auto'
        });

        // 然后调整滚动位置以增加下方 padding
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 如果元素贴近容器底部，向上滚动一点以增加下方 padding
        if (containerRect.bottom - elementRect.bottom < extraPadding) {
          const adjustScrollBy = extraPadding - (containerRect.bottom - elementRect.bottom);
          container.scrollBy({
            top: adjustScrollBy,
            behavior: 'smooth'
          });
        }

        // 更新状态
        lastScrolledValueRef.current = value;
        hasScrolledToSelectedRef.current = true;
        lastFilterTextRef.current = inputValue;
        lastFilteredOptionsCountRef.current = filteredOptions.length;
      } else if (!filterChanged) {
        // 只有在筛选条件未变化的情况下，才恢复上次的滚动位置
        optionsContainerRef.current.scrollTop = scrollPositionRef.current;
      }
    }

    if (isOpen) {
      setTimeout(checkMenuVisibility, 50);
    }
  }, [isOpen, isLoading, value, inputValue, filteredOptions.length]);

  // 在菜单关闭时保存滚动位置
  useEffect(() => {
    if (!isOpen && optionsContainerRef.current) {
      // 保存当前滚动位置
      scrollPositionRef.current = optionsContainerRef.current.scrollTop;
    }
  }, [isOpen]);

  // 添加滚动事件监听，用于记录用户手动滚动行为
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && optionsContainerRef.current) {
        scrollPositionRef.current = optionsContainerRef.current.scrollTop;
      }
    };

    const optionsContainer = optionsContainerRef.current;
    if (isOpen && optionsContainer) {
      optionsContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (optionsContainer) {
        optionsContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen]);

  // 当菜单打开时计算位置并调整容器
  useEffect(() => {
    if (isOpen) {
      // 给菜单渲染一点时间，然后检查可见性
      setTimeout(checkMenuVisibility, 50);
    }
  }, [isOpen]);

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当 value 变化时，同步更新 inputValue
  useEffect(() => {
    const selectedOption = options.find(option => option.id === value);
    setInputValue(selectedOption ? selectedOption.name : value);
  }, [value, options]);

  const checkMenuVisibility = () => {
    if (dialogContainerRef?.current && optionsContainerRef.current) {
      const optionsRect = optionsContainerRef.current.getBoundingClientRect();
      const containerRect = dialogContainerRef.current.getBoundingClientRect();

      // 检查菜单是否超出对话框底部
      if (optionsRect.bottom > containerRect.bottom) {
        dialogContainerRef.current.scrollBy({
          top: optionsRect.bottom - containerRect.bottom + 20,
          behavior: 'smooth'
        });
      }
      // 检查菜单是否超出对话框顶部
      else if (optionsRect.top < containerRect.top) {
        dialogContainerRef.current.scrollBy({
          top: optionsRect.top - containerRect.top - 20,
          behavior: 'smooth'
        });
      }
    }
  };

  // 加载模型列表
  const loadModels = async () => {
    if (isLoading || options.length > 0) return;

    setIsLoading(true);
    try {
      const models = await fetchModels();
      setOptions(models);
      setFilteredOptions(models);

      if (onFetch) {
        onFetch(models);
      }

      if (models.length > 0) {
        toast.success(t('toast.getModelListSuccess', { count: models.length }));
      } else {
        toast.info(t('toast.noModelAvailable'));
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      toast.error(t('toast.getModelListFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentValue = e.target.value;
    setInputValue(currentValue);

    // 如果没有模型列表，直接更新值
    if (options.length === 0) {
      onChange(currentValue);
      return;
    }

    // 过滤模型列表
    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(currentValue.toLowerCase()) ||
      option.id.toLowerCase().includes(currentValue.toLowerCase())
    );
    setFilteredOptions(filtered);

    // 重置滚动标志，因为筛选条件变化了
    hasScrolledToSelectedRef.current = false;
  };

  // 选择模型
  const selectModel = (option: ModelOption) => {
    onChange(option.id);
    setInputValue(option.name);
    setIsOpen(false);
  };

  // 处理失去焦点时的值更新
  const handleInputBlur = () => {
    // 如果没有模型列表，直接使用输入的值
    if (options.length === 0) {
      onChange(inputValue);
      return;
    }

    // 尝试查找匹配的模型
    const matchedOption = options.find(option =>
      option.name.toLowerCase() === inputValue.toLowerCase() ||
      option.id.toLowerCase() === inputValue.toLowerCase()
    );

    if (matchedOption) {
      onChange(matchedOption.id);
    } else {
      // 如果没有匹配，保留原始值或清空
      onChange(inputValue);
    }
  };

  // 点击按钮处理函数
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!disabled) {
      if (isOpen) {
        // 如果菜单已打开，只关闭菜单
        setIsOpen(false);
      } else {
        // 如果菜单未打开，加载模型并打开菜单
        loadModels();
        setIsOpen(true);
      }
    }
  };

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
    >
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              loadModels();
              setIsOpen(true);
            }
          }}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`
                        w-full p-2 pe-10 border rounded input placeholder-gray-400
                        ${disabled
              ? 'input-disabled'
              : ''}
                    `}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className={`
            absolute inset-y-0 end-0 flex items-center justify-center
            p-3 focus:outline-none
            ${disabled
              ? 'cursor-not-allowed input-select-button-disabled'
              : 'input-select-button'}
          `}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scaleY: 0.9
            }}
            animate={{
              opacity: 1,
              y: 0,
              scaleY: 1
            }}
            exit={{
              opacity: 0,
              y: -10,
              scaleY: 0.9
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            style={{
              transformOrigin: 'top',
              top: '100%',
              width: '100%'
            }}
            className="absolute z-100 left-0 right-0 mt-1 p-1 dropdown-menu space-y-1 backdrop-blur-md rounded-lg shadow-lg max-h-62 overflow-y-auto"
            ref={optionsContainerRef}
          >
            {isLoading ? (
              // 空白下拉菜单 - 加载状态
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 text-center flex items-center justify-center dropdown-null space-x-2"
              >
                <LoadingIcon />
                <span>{t('settings.loading')}</span>
              </motion.div>
            ) : filteredOptions.length === 0 ? (
              // 无结果状态
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="p-2 text-center dropdown-null"
              >
                {options.length === 0 ? t('settings.noModelAvailable') : t('settings.noMatchingModel')}
              </motion.div>
            ) : (
              // 选项列表
              <motion.div
                key="options"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.02
                    }
                  }
                }}
                className='space-y-1'
              >
                {filteredOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    ref={value === option.id ? selectedOptionRef : null}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectModel(option);
                    }}
                    className={`
                      p-2 cursor-pointer rounded-md
                      ${value === option.id ? 'dropdown-item-active' : 'dropdown-item-inactive'}
                    `}
                  >
                    <div className={`${value === option.id ? 'dropdown-item-active-title' : 'dropdown-item-inactive-title'}`}>
                      {option.name}
                    </div>
                    <div className={`text-xs ${value === option.id ? 'dropdown-item-active-description' : 'dropdown-item-inactive-description'}`}>
                      {option.id}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};