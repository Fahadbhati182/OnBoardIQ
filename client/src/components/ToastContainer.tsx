import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 size={18} color="#4ade80" />;
        if (toast.type === 'info') icon = <Info size={18} color="#38bdf8" />;
        if (toast.type === 'warning') icon = <AlertTriangle size={18} color="#fbbf24" />;
        if (toast.type === 'error') icon = <XCircle size={18} color="#f87171" />;

        return (
          <div key={toast.id} className="toast">
            {icon}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
