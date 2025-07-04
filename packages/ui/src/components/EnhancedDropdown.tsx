//packages/ui/src/components/EnhancedDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface DropdownOption {
  value: string;
  label: string;
}

interface EnhancedDropdownProps {
  id?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  className = ""
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLLIElement>(null);

  // Find the selected option for display
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 如果点击的是关联的 label，不要关闭下拉菜单
      if (id && target instanceof Element) {
        const associatedLabel = document.querySelector(`label[for="${id}"]`);
        if (associatedLabel && associatedLabel.contains(target)) {
          return; // 不关闭菜单，让 label 的点击事件正常处理开启/关闭菜单
        }
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [id]);

  // 滚动到选中项功能
  useEffect(() => {
    if (!isOpen || options.length === 0 || !value) return;

    // 检查是否有匹配的选项
    const hasMatchingOption = options.some(option => option.value === value);
    if (!hasMatchingOption) return;

    const scrollToSelected = () => {
      if (!optionsContainerRef.current) return;

      // 直接通过DOM查找选中的元素
      const container = optionsContainerRef.current;
      const selectedElement = container.querySelector(`[data-value="${value}"]`) as HTMLElement;

      if (!selectedElement) return;

      const extraPadding = 16; // 底部额外的间距

      // 先用instant滚动快速定位，然后微调
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'auto'
      });

      // 立即进行微调计算
      requestAnimationFrame(() => {
        const elementRect = selectedElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const actualBottomSpace = containerRect.bottom - elementRect.bottom;

        // 如果需要微调，使用smooth滚动
        if (actualBottomSpace < extraPadding) {
          const scrollAmount = extraPadding - actualBottomSpace;
          container.scrollBy({
            top: scrollAmount,
            behavior: 'smooth' // 只有微调使用smooth
          });
        }
      });
    };

    // 给DOM一点渲染时间，然后滚动
    const timer = setTimeout(scrollToSelected, 100);

    return () => clearTimeout(timer);
  }, [isOpen, value, options.length]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`text-sm font-medium w-full flex items-center justify-between rounded-lg border input-dropdown-button ${className}
                    ${disabled
            ? 'input-disabled cursor-not-allowed'
            : ''
          }`}
        disabled={disabled}
      >
        <span className="px-3 py-2 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          className={`p-2 input-select-button`}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

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
              duration: 0.4,
              ease: "easeOut"
            }}
            style={{
              transformOrigin: 'top'
            }}
            className="absolute z-40 w-full mt-1 rounded-xl shadow-lg max-h-[247px] overflow-y-auto dropdown-menu backdrop-blur-md"
            ref={optionsContainerRef}
          >
            <ul className="py-1 space-y-1">
              <AnimatePresence mode="popLayout">
                {options.map((option, index) => (
                  <motion.li
                    key={option.value}
                    data-value={option.value}
                    ref={option.value === value ? selectedOptionRef : null}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 0 }}
                    transition={{
                      duration: 0.15,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-3 py-3 cursor-pointer text-sm mx-1 rounded-lg
                  ${option.value === value
                        ? 'dropdown-item-active dropdown-item-active-title'
                        : 'dropdown-item-inactive dropdown-item-inactive-title'
                      }`}
                  >
                    {option.label}
                  </motion.li>
                ))}

                {options.length === 0 && (
                  <motion.li
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 py-2 text-sm italic dropdown-null"
                  >
                    {t('common.dropdownNull')}
                  </motion.li>
                )}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedDropdown;