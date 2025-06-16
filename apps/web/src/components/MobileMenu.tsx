// src/components/MobileMenu.tsx
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

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
  toggleButtonRef?: React.RefObject<HTMLButtonElement | null>; // 添加对菜单按钮的引用
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
  const menuRef = useRef<HTMLElement>(null);

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

  if (!mounted || !portalRoot || !isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden pointer-events-none">
      {/* 菜单内容 - 只有菜单本身接收点击事件 */}
      <nav
        ref={menuRef}
        className={`absolute top-18 ${isRTL ? 'left-4' : 'right-4'} overflow-hidden rounded-2xl shadow-lg pointer-events-auto mobile-menu-container menu-container-animation ${isRTL ? 'rtl' : ''}`}
        aria-label={t('aria.mobileMenu')}
      >
        <div className="p-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 mb-1 last:mb-0 transition-all duration-200 menu-item-animation ${activeTab === tab.id
                ? 'mobile-menu-active'
                : 'mobile-menu-inactive'
                }`}
              style={{ animationDelay: `${index * 200}ms`, opacity: 0 }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon && React.createElement(tab.icon, { size: 18 })}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>,
    portalRoot
  );
};

export default MobileMenu;