import React, { useEffect } from 'react';
import { FiAlertTriangle, FiHelpCircle, FiTrash2 } from 'react-icons/fi';

const TONES = {
  default: {
    iconWrap: 'bg-indigo-100',
    icon: 'text-indigo-600',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    Icon: FiHelpCircle,
  },
  danger: {
    iconWrap: 'bg-red-100',
    icon: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700',
    Icon: FiTrash2,
  },
  warning: {
    iconWrap: 'bg-amber-100',
    icon: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700',
    Icon: FiAlertTriangle,
  },
};

const ConfirmModal = ({
  open,
  title = 'Confirmer',
  message,
  details,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const toneCfg = TONES[tone] || TONES.default;
  const { Icon } = toneCfg;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="alertdialog"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${toneCfg.iconWrap}`}>
              <Icon className={`h-5 w-5 ${toneCfg.icon}`} />
            </div>
            <div className="min-w-0">
              <h2 id="confirm-modal-title" className="text-lg font-bold text-slate-900">
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div id="confirm-modal-desc" className="space-y-3 px-5 py-4 text-sm text-slate-700">
          {message && <p>{message}</p>}
          {Array.isArray(details) && details.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-slate-600">
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${toneCfg.button}`}
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
