// src/components/MobileMenu.tsx
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// 菜单类型定义
export type TabItem = {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  toggleButtonRef?: React.RefObject<HTMLButtonElement | null>;
  isRTL?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  toggleButtonRef,
  isRTL = false,
}) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 在组件挂载后才渲染Portal，避免SSR问题
  useEffect(() => {
    setMounted(true);

    // 添加点击外部关闭菜单的处理函数
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在菜单内部
      const isClickInsideMenu = menuRef.current && menuRef.current.contains(event.target as Node);

      // 检查点击是否在切换按钮上
      const isClickOnToggleButton = toggleButtonRef?.current && toggleButtonRef.current.contains(event.target as Node);

      // 只有当点击既不在菜单内部，也不在切换按钮上时，才关闭菜单
      if (!isClickInsideMenu && !isClickOnToggleButton && isOpen) {
        onClose();
      }
    };

    // 添加点击事件监听器
    document.addEventListener('mousedown', handleClickOutside);

    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, toggleButtonRef]);

  // 处理点击菜单项
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose();
  };

  // 渲染Portal的目标元素
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  if (!mounted || !portalRoot) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden pointer-events-none">
          {/* 菜单内容 - 只有菜单本身接收点击事件 */}
          <motion.nav
            ref={menuRef}
            initial={{
              opacity: 0,
              scale: 0.75,
              y: -10
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.75,
              y: -10
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut"
            }}
            style={{
              transformOrigin: isRTL ? 'top left' : 'top right'
            }}
            className={`absolute top-18 ${isRTL ? 'left-2' : 'right-2'} overflow-hidden rounded-2xl shadow-lg pointer-events-auto mobile-menu-container`}
            aria-label={t('aria.mobileMenu')}
          >
            <motion.div className="p-1 space-y-1">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center space-x-2 px-4 py-3 ${activeTab === tab.id
                      ? 'mobile-menu-active'
                      : 'mobile-menu-inactive'
                    }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.icon && React.createElement(tab.icon, { size: 18 })}
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>,
    portalRoot
  );
};

export default MobileMenu;