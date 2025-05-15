//packages/ui/src/components/EnhancedDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
                className={`w-full flex items-center justify-between rounded-lg border input-dropdown-button ${className}
                    ${disabled
                        ? 'input-disabled cursor-not-allowed'
                        : ''
                    }`}
                disabled={disabled}
            >
                <span className="px-3 py-2 truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className={`p-2 input-select-button transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}>
                    <ChevronDown size={16} />
                </div>
            </button>

            {isOpen && (
                <div
                    className="absolute z-40 w-full mt-1 rounded-xl shadow-lg max-h-[247px] overflow-y-auto dropdown-menu backdrop-blur-md"
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
                                className={`px-3 py-3 cursor-pointer text-sm mx-1 rounded-lg mb-1 last:mb-0
                                    ${option.value === value
                                        ? 'dropdown-item-active dropdown-item-active-title'
                                        : 'dropdown-item-inactive dropdown-item-inactive-title'
                                    }`}
                            >
                                {option.label}
                            </li>
                        ))}

                        {options.length === 0 && (
                            <li className="px-3 py-2 text-sm italic dropdown-null">
                                {t('common.dropdownNull')}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EnhancedDropdown;