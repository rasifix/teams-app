import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ModalFooter } from './ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonColor?: 'red' | 'blue' | 'green';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmButtonColor = 'red'
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const resolvedConfirmText = confirmText ?? t('common.actions.confirm');
  const resolvedCancelText = cancelText ?? t('common.actions.cancel');

  const confirmButtonStyles = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-400',
    blue: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400',
    green: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400'
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="!max-w-md">
      <ModalBody>
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              confirmButtonColor === 'red' ? 'bg-red-100' : 
              confirmButtonColor === 'blue' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {confirmButtonColor === 'red' ? (
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : confirmButtonColor === 'blue' ? (
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {message}
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">
          {resolvedCancelText}
        </button>
        <button type="button" onClick={onConfirm} className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonStyles[confirmButtonColor]}`}>
          {resolvedConfirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}
