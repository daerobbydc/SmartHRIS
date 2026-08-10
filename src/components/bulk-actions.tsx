"use client";

import { useState } from "react";
import { Trash2, Edit, CheckSquare, Square, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModernButton } from "@/components/ui";

interface BulkActionsProps {
  selectedIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  totalItems: number;
  onDelete: (ids: string[]) => Promise<void>;
  onStatusChange?: (ids: string[], status: string) => Promise<void>;
  statusOptions?: { value: string; label: string }[];
}

export function BulkActions({
  selectedIds,
  onSelectAll,
  onDeselectAll,
  totalItems,
  onDelete,
  onStatusChange,
  statusOptions,
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} item yang dipilih?`)) return;
    setLoading(true);
    try {
      await onDelete(selectedIds);
      onDeselectAll();
    } finally {
      setLoading(false);
      setShowActions(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!onStatusChange) return;
    setLoading(true);
    try {
      await onStatusChange(selectedIds, status);
      onDeselectAll();
    } finally {
      setLoading(false);
      setShowActions(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckSquare className="h-5 w-5 text-teal-600" />
          <span className="font-medium">{selectedIds.length}</span> dipilih
          {selectedIds.length < totalItems && (
            <button
              onClick={onSelectAll}
              className="text-teal-600 hover:text-teal-700 ml-2"
            >
              Pilih semua ({totalItems})
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          {onStatusChange && statusOptions && (
            <div className="relative">
              <ModernButton
                variant="secondary"
                size="sm"
                icon={<Edit className="h-4 w-4" />}
                onClick={() => setShowActions(!showActions)}
              >
                Ubah Status
              </ModernButton>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                  >
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <ModernButton
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
            disabled={loading}
          >
            Hapus
          </ModernButton>

          <ModernButton
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
          >
            Batal
          </ModernButton>
        </div>
      </div>
    </motion.div>
  );
}

interface SelectableTableProps {
  children: React.ReactNode;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  items: { id: string }[];
}

export function SelectableTable({
  children,
  selectedIds,
  onSelectionChange,
  items,
}: SelectableTableProps) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <button onClick={toggleAll} className="p-1 hover:bg-gray-200 rounded">
          {allSelected ? (
            <CheckSquare className="h-5 w-5 text-teal-600" />
          ) : someSelected ? (
            <div className="h-5 w-5 border-2 border-teal-600 rounded flex items-center justify-center">
              <div className="h-2 w-2 bg-teal-600 rounded" />
            </div>
          ) : (
            <Square className="h-5 w-5 text-gray-400" />
          )}
        </button>
        <span className="text-sm text-gray-600">
          {selectedIds.length > 0
            ? `${selectedIds.length} dipilih`
            : "Pilih semua"}
        </span>
      </div>
      {children}
    </div>
  );
}
