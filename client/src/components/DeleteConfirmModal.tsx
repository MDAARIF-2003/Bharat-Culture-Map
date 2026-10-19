import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  itemType?: string;
  itemName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function DeleteConfirmModal({
  open,
  title,
  message,
  itemType = "item",
  itemName,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const modalTitle = title || `Confirm Deletion of ${itemType.toUpperCase()}`;
  const modalMessage = message || `Are you sure you want to permanently delete this ${itemType}? This action cannot be undone.`;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#161a29] p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-red-400">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-500/30 bg-red-500/10">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{modalTitle}</h3>
            <p className="text-xs text-red-300/80">Permanent action</p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-white/70">
          {modalMessage}
        </p>

        {itemName && (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-[#efb167] truncate">
            {itemName}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
