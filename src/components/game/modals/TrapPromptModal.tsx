// src/components/game/modals/TrapPromptModal.tsx
import React from "react";

interface TrapPromptModalProps {
  prompt: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;
}

export default function TrapPromptModal({ prompt }: TrapPromptModalProps) {
  if (!prompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-[2px] flex items-start justify-center pt-24">
      <div className="bg-gray-900/95 border-4 border-red-600 rounded-xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.8)] max-w-md w-full flex flex-col items-center animate-bounce-short">
        <h2 className="text-red-500 font-black text-2xl uppercase tracking-widest mb-4">
          Corrente Ativada!
        </h2>
        <p className="text-white text-center text-lg mb-8 font-serif">
          {prompt.message}
        </p>
        <div className="flex gap-6 w-full">
          <button
            onClick={prompt.onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            Não ativar
          </button>
          <button
            onClick={prompt.onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all"
          >
            Ativar Armadilha!
          </button>
        </div>
      </div>
    </div>
  );
}
