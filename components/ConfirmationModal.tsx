import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checkboxValue: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCheckbox?: boolean;
  checkboxLabel?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  showCheckbox = false,
  checkboxLabel,
}) => {
  const { t } = useTranslation();
  const [checkboxValue, setCheckboxValue] = React.useState(false);

  if (!isOpen) return null;

  const resolvedConfirm = confirmText ?? t('confirm.deleteDefault');
  const resolvedCancel = cancelText ?? t('confirm.cancelDefault');
  const resolvedCheckbox = checkboxLabel ?? t('confirm.deleteAllInstallments');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
          
          {showCheckbox && (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-800">
              <input 
                type="checkbox" 
                id="modal-checkbox"
                checked={checkboxValue}
                onChange={(e) => setCheckboxValue(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-slate-900"
              />
              <label htmlFor="modal-checkbox" className="text-sm text-slate-300 font-medium cursor-pointer select-none">
                {resolvedCheckbox}
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={() => {
                setCheckboxValue(false);
                onClose();
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors"
            >
              {resolvedCancel}
            </button>
            <button 
              onClick={() => {
                onConfirm(checkboxValue);
                setCheckboxValue(false);
                onClose();
              }}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
            >
              {resolvedConfirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
