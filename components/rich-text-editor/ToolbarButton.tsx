import React from 'react';

// ✨ TipTap 工具栏按钮组件
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-lg transition-all ${
      isActive 
        ? 'bg-blue-100 text-blue-600' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);