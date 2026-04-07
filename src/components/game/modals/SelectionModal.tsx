// src/components/game/modals/SelectionModal.tsx
import React from "react";

interface SelectionModalProps {
  selection: {
    message: string;
    validTargetIds: string[];
    onSelect: (id: string) => void;
    onCancel: () => void;
  } | null;
}

export default function SelectionModal({ selection }: SelectionModalProps) {
  if (!selection) return null;

  return (
    <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 bg-gray-900 border-2 border-emerald-400 p-4 rounded-xl z-[9999] text-center shadow-[0_0_30px_rgba(52,211,153,0.5)] animate-pulse pointer-events-none">
      <h3 className="text-emerald-400 font-bold text-xl uppercase tracking-widest">
        {selection.message}
      </h3>
      <p className="text-gray-300 text-xs mt-1">
        Clique em uma carta brilhando verde na mesa
      </p>
    </div>
  );
}
