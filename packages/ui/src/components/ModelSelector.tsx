// packages/ui/src/components/ModelSelectorNew.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { toast } from '../index';
import { DialogContext } from './Dialog';
import { ChevronDown } from 'lucide-react';

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
                // 滚动到选中项
                selectedOptionRef.current.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
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
                toast.success(`成功获取 ${models.length} 个模型`);
            } else {
                toast.info('没有可用的模型');
            }
        } catch (error) {
            console.error('获取模型列表失败:', error);
            toast.error('获取模型列表失败');
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
                        w-full p-2 pr-10 border rounded focus:outline-hidden 
                        border-gray-300 bg-gray-50 text-gray-600
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                        ${disabled
                            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                            : 'hover:border-blue-500 dark:hover:border-blue-400'}
                    `}
                />
                <button
                    type="button"
                    onClick={handleButtonClick}
                    disabled={disabled}
                    className={`
                        absolute inset-y-0 right-0 flex items-center justify-center
                        p-3 focus:outline-none
                        ${disabled
                            ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                            : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}
                    `}
                >
                    <ChevronDown size={14} />
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute z-100 left-0 right-0 mt-1 p-1 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{
                        top: '100%', // 相对于父组件底部
                        width: '100%'
                    }}
                    ref={optionsContainerRef}
                >
                    {isLoading ? (
                        <div className="p-2 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
                            <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>加载中...</span>
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                            {options.length === 0 ? '没有可用的模型' : '没有匹配的模型'}
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.id}
                                ref={value === option.id ? selectedOptionRef : null}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // 阻止默认行为
                                    e.stopPropagation(); // 阻止事件冒泡
                                    selectModel(option);
                                }}
                                className={`
                                    p-2 cursor-pointer rounded-md
                                    ${value === option.id ? 'bg-blue-500 dark:bg-blue-900 hover:bg-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                                `}
                            >
                                <div className={`${value === option.id ? 'text-white dark:text-white' : 'text-gray-500 dark:text-gray-300'}`}>
                                    {option.name}
                                </div>
                                <div className={`text-xs ${value === option.id ? 'text-blue-200 dark:text-gray-200' : 'text-gray-400 dark:text-gray-400'}`}>
                                    {option.id}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};