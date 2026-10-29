import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

export type ToastVariant = 'success' | 'danger';

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToasts((current) => [...current, { id: Date.now() + current.length, message, variant }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 2000 }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} bg={toast.variant} autohide delay={5000} onClose={() => dismiss(toast.id)}>
            <Toast.Body className="text-white fw-semibold d-flex justify-content-between align-items-start gap-2">
              <span>{toast.message}</span>
              <button type="button" className="btn-close btn-close-white" aria-label="Fermer la notification" onClick={() => dismiss(toast.id)} />
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé à l’intérieur d’un <ToastProvider>.');
  return context;
}
