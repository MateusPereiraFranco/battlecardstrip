// src/components/game/modals/DeckSearchModal.tsx
import React from "react";
import CardView from "../CardView";
import { Card } from "../../../types/card";

interface DeckSearchModalProps {
  search: {
    message: string;
    validCards: Card[];
    onSelect: (id: string) => void;
    onCancel: () => void;
  } | null;
}

export default function DeckSearchModal({ search }: DeckSearchModalProps) {
  if (!search) return null;

  return (
    <div
      className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[9900] flex flex-col p-8 border-t-4 border-yellow-500"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full flex justify-between items-center mb-6 border-b-2 border-yellow-600 pb-4">
        <h2 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">
          {search.message}
        </h2>
        <button
          onClick={search.onCancel}
          className="text-gray-400 hover:text-white font-bold text-3xl transition-colors bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
        >
          &times;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-wrap gap-4 content-start">
        {search.validCards.map((c, i) => (
          <CardView
            key={`search-${c.id}-${i}`}
            card={{ ...c, id: `${c.id}-search` }}
            disableDrag={true}
            onClick={() => search.onSelect(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
