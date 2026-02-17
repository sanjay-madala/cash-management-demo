import { Upload, X, Paperclip } from 'lucide-react';

export default function AttachmentList({ files = [], onAdd, onRemove, readOnly = false, label = 'Attachments', grouped = false }) {
  const handleAdd = () => {
    const name = `file_${Date.now().toString(36)}.pdf`;
    onAdd?.(name);
  };

  if (readOnly) {
    if (files.length === 0) return null;
    return (
      <div>
        {label && <span className="text-xs font-semibold text-text-secondary">{label}</span>}
        <div className="flex flex-wrap gap-2 mt-1">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-brand/5 text-brand text-xs rounded border border-brand/20">
              <Paperclip size={12} /> {typeof f === 'string' ? f : f.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>}
      <div className="flex flex-wrap items-center gap-2">
        {files.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-bg-primary text-sm rounded border border-border">
            <Paperclip size={12} /> {typeof f === 'string' ? f : f.name}
            <button onClick={() => onRemove?.(i)} className="ml-1 text-negative hover:text-negative/80">
              <X size={12} />
            </button>
          </span>
        ))}
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors"
        >
          <Upload size={14} /> Add File
        </button>
      </div>
    </div>
  );
}
