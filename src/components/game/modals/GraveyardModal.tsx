// src/components/modals/GraveyardModal.tsx
import React from "react";
import CardView from "../CardView";
import { Card } from "../../../types/card";

interface GraveyardModalProps {
  isOpen: boolean;
  isOpponent?: boolean;
  cards: Card[];
  onClose: () => void;
  onCardClick: (card: Card) => void;
}

export default function GraveyardModal({
  isOpen,
  isOpponent = false,
  cards,
  onClose,
  onCardClick,
}: GraveyardModalProps) {
  if (!isOpen) return null;

  // Lógica inteligente: O componente muda de cor dependendo de quem é o dono!
  const borderColor = isOpponent ? "border-red-900" : "border-blue-900";
  const textColor = isOpponent ? "text-red-500" : "text-blue-500";
  const title = isOpponent ? "Cemitério Oponente" : "Cemitério";
  const borderSide = isOpponent ? "border-r-4" : "border-l-4";

  return (
    <div
      className={`absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col p-8 ${borderSide} ${borderColor}`}
      onClick={onClose}
    >
      <div
        className={`w-full flex justify-between items-center mb-6 border-b-2 ${borderColor} pb-4 shrink-0`}
      >
        <h2
          className={`text-2xl font-bold ${textColor} uppercase tracking-widest`}
        >
          {title} ({cards.length})
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold text-3xl transition-colors bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
        >
          &times;
        </button>
      </div>

      <div
        className={`flex-1 overflow-y-auto flex flex-wrap gap-4 content-start ${
          isOpponent
            ? "justify-start p-4 bg-black/30 rounded-xl border border-gray-700"
            : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {[...cards].reverse().map((c, i) => (
          <CardView
            key={`gy-${c.id}-${i}`}
            card={{ ...c, id: `${c.id}-modal` }}
            disableDrag={true}
            onClick={() => onCardClick(c)}
            isOpponent={isOpponent}
          />
        ))}
      </div>
    </div>
  );
}
