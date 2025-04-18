//packages/ui/src/components/EnhancedDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
    value: string;
    label: string;
}

interface EnhancedDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select an option...",
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const optionsContainerRef = useRef<HTMLDivElement | null>(null);
    const selectedOptionRef = useRef<HTMLLIElement | null>(null);

    // Find the selected option for display
    const selectedOption = options.find(option => option.value === value);

    // Close dropdown when clicking outside
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

    // Scroll to the selected option when dropdown opens
    useEffect(() => {
        if (isOpen && selectedOptionRef.current && optionsContainerRef.current) {
            // 计算需要滚动的位置
            const containerRect = optionsContainerRef.current.getBoundingClientRect();
            const selectedRect = selectedOptionRef.current.getBoundingClientRect();
            
            // 检查选中项是否在可视区域内
            if (selectedRect.top < containerRect.top || selectedRect.bottom > containerRect.bottom) {
                // 滚动到选中项，使其在可视区域内
                selectedOptionRef.current.scrollIntoView({
                    block: 'nearest', // 'nearest' 将尝试最小的滚动量
                    behavior: 'smooth' // 平滑滚动
                });
            }
        }
    }, [isOpen, value]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500
                    ${disabled
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 text-gray-900 dark:text-white'
                    } transition-colors`}
                disabled={disabled}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown 
                    size={16} 
                    className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div 
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-[247px] overflow-y-auto"
                    ref={optionsContainerRef}
                >
                    <ul className="py-1">
                        {options.map((option) => (
                            <li
                                key={option.value}
                                ref={option.value === value ? selectedOptionRef : null}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-3 cursor-pointer text-sm mx-1 rounded mb-1 last:mb-0
                                    ${option.value === value
                                        ? 'bg-blue-100 font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-800! dark:text-white! dark:hover:bg-blue-700!'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {option.label}
                            </li>
                        ))}

                        {options.length === 0 && (
                            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">没有可选项</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EnhancedDropdown;