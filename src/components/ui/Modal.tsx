import { createContext, useContext, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const ModalTitleIdContext = createContext<string | undefined>(undefined);

export function Modal({ isOpen, onClose, children, className = '', size = 'md' }: ModalProps) {
  const isPointerDownOnOverlay = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
    (focusable ?? dialog)?.focus();

    return () => previouslyFocused?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={dialogRef} className={`modal-content modal-content--${size} ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <ModalTitleIdContext.Provider value={titleId}>{children}</ModalTitleIdContext.Provider>
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
  const titleId = useContext(ModalTitleIdContext);
  return (
    <h2 id={titleId} className={`modal-title ${className}`}>
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
