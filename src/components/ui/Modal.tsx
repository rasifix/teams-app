import { useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  const isPointerDownOnOverlay = useRef(false);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    isPointerDownOnOverlay.current = event.target === event.currentTarget;
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPointerDownOnOverlay.current && event.target === event.currentTarget) {
      onClose();
    }
    isPointerDownOnOverlay.current = false;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    isPointerDownOnOverlay.current = event.target === event.currentTarget;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isPointerDownOnOverlay.current && event.target === event.currentTarget) {
      onClose();
    }
    isPointerDownOnOverlay.current = false;
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
