import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-lg shadow-xl border border-border w-full max-w-lg mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-bg-primary rounded transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
