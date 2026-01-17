import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
};

const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    const closeTimer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const Icon = iconMap[type];

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
        ${styleMap[type]}
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
        transition-all duration-300
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColorMap[type]}`} />
      <span className="font-medium text-sm flex-1">{message}</span>
      <button
        onClick={handleClose}
        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType; duration?: number }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
