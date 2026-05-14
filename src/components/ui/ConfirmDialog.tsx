import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmer",
  cancelText = "Annuler"
}: Readonly<ConfirmDialogProps>) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button by default for quick enter
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-white mb-2 font-display leading-none">{title}</h3>
            <div className="text-sm text-slate-300 font-medium">{message}</div>
          </div>
          <button 
            onClick={onCancel}
            className="self-start text-slate-500 hover:text-white transition-colors p-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-white/5 p-4 flex gap-3 justify-end border-t border-white/5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-bold text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 outline-none"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
