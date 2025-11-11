import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface ModalSectionProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className = '' }: ModalSectionProps) {
  return (
    <div className={`modal-header ${className}`}>
      {children}
    </div>
  );
}

export function ModalTitle({ children, className = '' }: ModalSectionProps) {
  return (
    <h2 className={`modal-title ${className}`}>
      {children}
    </h2>
  );
}

export function ModalSubtitle({ children, className = '' }: ModalSectionProps) {
  return (
    <p className={`modal-subtitle ${className}`}>
      {children}
    </p>
  );
}

export function ModalBody({ children, className = '' }: ModalSectionProps) {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }: ModalSectionProps) {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
}
