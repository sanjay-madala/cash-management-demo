import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'bg-positive/10 border-positive/30 text-positive',
  error: 'bg-negative/10 border-negative/30 text-negative',
  info: 'bg-brand/10 border-brand/30 text-brand',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-2 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right ${COLORS[toast.type] || COLORS.info}`}
          >
            <Icon size={16} className="shrink-0 mt-0.5" />
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
