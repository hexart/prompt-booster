// packages/ui/src/components/ListCard/ListCard.tsx
import React, { ReactNode } from 'react';

export type ListCardInfoItem = {
  key: string;
  value: string | ReactNode;
};

export type ListCardProps = {
  // 数据属性
  title: string;
  description?: string;
  infoItems?: ListCardInfoItem[];

  // 渲染函数
  renderTitle?: (title: string) => ReactNode;
  renderDescription?: (description: string) => ReactNode;
  renderInfoItem?: (item: ListCardInfoItem, index: number) => ReactNode;

  // 右侧操作区域
  actions?: ReactNode;

  // 容器类名
  className?: string;
  children?: ReactNode;

  // 点击事件
  onClick?: () => void;
};

export const ListCard: React.FC<ListCardProps> = ({
  title,
  description,
  infoItems = [],
  renderTitle,
  renderDescription,
  renderInfoItem,
  actions,
  className = '',
  children,
  onClick
}) => {
  return (
    <div
      className={`${className}`}
      onClick={onClick}
    >
      <div className="flex">
        <div className="grow w-1/2 min-w-[33%] pe-4 overflow-hidden">
          {/* 标题 */}
          {renderTitle ? renderTitle(title) : <h3 className="truncate">{title}</h3>}

          {/* 描述 */}
          {description && (renderDescription
            ? renderDescription(description)
            : <div className="truncate">{description}</div>
          )}

          {/* 信息项 */}
          {infoItems.map((item, index) => (
            renderInfoItem
              ? renderInfoItem(item, index)
              : <div key={index} className="truncate">{item.key}: {item.value}</div>
          ))}
        </div>

        {/* 操作区域 */}
        {actions}
      </div>

      {/* 额外内容 */}
      {children}
    </div>
  );
};

export default ListCard;