// apps/web/src/components/ui/components/ModelSelector.tsx
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
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
  id?: string;
  value: string;
  onChange: (value: string) => void;
  fetchModels: () => Promise<ModelOption[]>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFetch?: (options: ModelOption[]) => void;
}

// 滚动状态管理类型
interface ScrollState {
  position: number;
  lastScrolledValue: string | null;
  hasScrolledToSelected: boolean;
  lastFilterText: string;
  lastFilteredCount: number;
}

// 自定义 Hook：滚动管理
const useScrollManagement = (
  isOpen: boolean, 
  value: string, 
  inputValue: string, 
  filteredOptions: ModelOption[]
) => {
  const selectedOptionRef = useRef<HTMLDivElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef<ScrollState>({
    position: 0,
    lastScrolledValue: null,
    hasScrolledToSelected: false,
    lastFilterText: '',
    lastFilteredCount: 0
  });

  // 当菜单打开时，滚动到选中的选项
  useEffect(() => {
    if (isOpen && !selectedOptionRef.current || !optionsContainerRef.current) return;
    
    const state = scrollState.current;
    
    // 检查筛选条件是否变化
    const filterChanged = 
      inputValue !== state.lastFilterText ||
      filteredOptions.length !== state.lastFilteredCount;

    // 检查是否需要滚动到选中项
    const needsToScrollToSelected =
      value !== state.lastScrolledValue ||
      !state.hasScrolledToSelected ||
      filterChanged;

    if (needsToScrollToSelected && selectedOptionRef.current) {
      const element = selectedOptionRef.current;
      const container = optionsContainerRef.current;
      const extraPadding = 6;

      // 先滚动到选中项
      element.scrollIntoView({
        block: 'nearest',
        behavior: 'auto'
      });

      // 然后调整滚动位置以增加下方 padding
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (containerRect.bottom - elementRect.bottom < extraPadding) {
        const adjustScrollBy = extraPadding - (containerRect.bottom - elementRect.bottom);
        container.scrollBy({
          top: adjustScrollBy,
          behavior: 'smooth'
        });
      }

      // 更新状态
      state.lastScrolledValue = value;
      state.hasScrolledToSelected = true;
      state.lastFilterText = inputValue;
      state.lastFilteredCount = filteredOptions.length;
    } else if (!filterChanged) {
      // 只有在筛选条件未变化的情况下，才恢复上次的滚动位置
      optionsContainerRef.current.scrollTop = state.position;
    }
  }, [isOpen, value, inputValue, filteredOptions.length]);

  // 在菜单关闭时保存滚动位置
  useEffect(() => {
    if (!isOpen && optionsContainerRef.current) {
      scrollState.current.position = optionsContainerRef.current.scrollTop;
    }
  }, [isOpen]);

  // 添加滚动事件监听，用于记录用户手动滚动行为
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && optionsContainerRef.current) {
        scrollState.current.position = optionsContainerRef.current.scrollTop;
      }
    };

    const optionsContainer = optionsContainerRef.current;
    if (isOpen && optionsContainer) {
      optionsContainer.addEventListener('scroll', handleScroll);
      return () => optionsContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  return { selectedOptionRef, optionsContainerRef };
};

// 自定义 Hook：菜单位置管理
const useMenuPositioning = (isOpen: boolean, optionsContainerRef: React.RefObject<HTMLDivElement | null>) => {
  const { containerRef: dialogContainerRef } = useContext(DialogContext);

  // 当菜单打开时计算位置并调整容器
  useEffect(() => {
    if (!isOpen) return;

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

    // 给菜单渲染一点时间，然后检查可见性
    setTimeout(checkMenuVisibility, 50);
  }, [isOpen, dialogContainerRef, optionsContainerRef]);
};

// 自定义 Hook：模型数据管理
const useModelData = (
  fetchModels: () => Promise<ModelOption[]>, 
  onFetch?: (options: ModelOption[]) => void
) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    if (isLoading || options.length > 0) return;

    setIsLoading(true);
    try {
      const models = await fetchModels();
      setOptions(models);

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
  }, [fetchModels, onFetch, isLoading, options.length, t]);

  return { options, isLoading, loadModels };
};

// 自定义 Hook：筛选和输入管理
const useFilteringAndInput = (options: ModelOption[], value: string, onChange: (value: string) => void) => {
  const [filteredOptions, setFilteredOptions] = useState<ModelOption[]>([]);
  const [inputValue, setInputValue] = useState(value);

  // 当 value 变化时，同步更新 inputValue
  useEffect(() => {
    const selectedOption = options.find(option => option.id === value);
    setInputValue(selectedOption ? selectedOption.name : value);
  }, [value, options]);

  // 当选项列表变化时，基于当前输入值重新筛选
  useEffect(() => {
    if (options.length === 0) {
      setFilteredOptions([]);
      return;
    }

    // 如果输入值为空或等于当前选中项的名称，显示所有选项
    const selectedOption = options.find(option => option.id === value);
    const selectedName = selectedOption ? selectedOption.name : value;
    
    if (!inputValue || inputValue === selectedName) {
      setFilteredOptions(options);
    } else {
      // 否则进行筛选
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.id.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [options, inputValue, value]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [options, onChange]);

  // 处理失去焦点时的值更新
  const handleInputBlur = useCallback(() => {
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
  }, [options, inputValue, onChange]);

  return {
    inputValue,
    filteredOptions,
    handleInputChange,
    handleInputBlur
  };
};

// 主组件
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  id,
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 使用自定义 Hooks
  const { options, isLoading, loadModels } = useModelData(fetchModels, onFetch);
  const { inputValue, filteredOptions, handleInputChange, handleInputBlur } = useFilteringAndInput(options, value, onChange);
  const { selectedOptionRef, optionsContainerRef } = useScrollManagement(isOpen, value, inputValue, filteredOptions);
  useMenuPositioning(isOpen, optionsContainerRef);

  // 选择模型
  const selectModel = useCallback((option: ModelOption) => {
    onChange(option.id);
    setIsOpen(false);
  }, [onChange]);

  // 点击按钮处理函数
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!disabled) {
      if (isOpen) {
        setIsOpen(false);
      } else {
        loadModels();
        setIsOpen(true);
      }
    }
  }, [disabled, isOpen, loadModels]);

  // 处理输入框获得焦点
  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      loadModels();
      setIsOpen(true);
    }
  }, [disabled, loadModels]);

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full p-2 pe-10 border rounded input placeholder-gray-400
            ${disabled ? 'input-disabled' : ''}
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
            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              transformOrigin: 'top',
              top: '100%',
              width: '100%'
            }}
            className="absolute z-100 left-0 right-0 mt-1 p-1 dropdown-menu space-y-1 backdrop-blur-md rounded-lg shadow-lg max-h-62 overflow-y-auto"
            ref={optionsContainerRef}
          >
            {isLoading ? (
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
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="p-2 text-center dropdown-null"
              >
                {options.length === 0 
                  ? t('settings.noModelAvailable') 
                  : t('settings.noMatchingModel')}
              </motion.div>
            ) : (
              <motion.div
                key="options"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.02 }
                  }
                }}
                className="space-y-1"
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
                      ${value === option.id 
                        ? 'dropdown-item-active' 
                        : 'dropdown-item-inactive'}
                    `}
                  >
                    <div className={`${value === option.id 
                      ? 'dropdown-item-active-title' 
                      : 'dropdown-item-inactive-title'}`}>
                      {option.name}
                    </div>
                    <div className={`text-xs ${value === option.id 
                      ? 'dropdown-item-active-description' 
                      : 'dropdown-item-inactive-description'}`}>
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