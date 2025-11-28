
import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useSettings } from '../../hooks/use-settings';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, onClose, onConfirm, title, message, isLoading, confirmText
}) => {
  const { t } = useSettings();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-dark-700 bg-dark-900 p-6 shadow-2xl shadow-black scale-100 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            {title}
          </h2>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-8">
           <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
             <p className="text-neutral-200 text-sm leading-relaxed">
               {message}
             </p>
           </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="border-dark-700 hover:bg-dark-800"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            disabled={isLoading}
            className="shadow-lg shadow-red-900/20"
          >
            {isLoading ? t('common.processing') : (confirmText || t('common.confirm'))}
          </Button>
        </div>
      </div>
    </div>
  );
};
