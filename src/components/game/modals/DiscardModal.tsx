// src/components/game/modals/DiscardModal.tsx
import React from "react";
import CardView from "../CardView";
import { Card } from "../../../types/card";

interface DiscardModalProps {
  discard: {
    message: string;
    onDiscard: (id: string) => void;
  } | null;
  hand: Card[];
  onCancel: () => void;
}

export default function DiscardModal({
  discard,
  hand,
  onCancel,
}: DiscardModalProps) {
  if (!discard) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9950] flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border-2 border-purple-500 p-6 rounded-xl shadow-2xl max-w-2xl w-full">
        <h2 className="text-purple-400 font-bold text-xl mb-4 text-center uppercase">
          {discard.message}
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {hand.map((c) => (
            <div
              key={`discard-${c.id}`}
              className="hover:scale-110 transition-transform cursor-pointer brightness-75 hover:brightness-125"
            >
              <CardView
                card={c}
                onClick={() => discard.onDiscard(c.id)}
                disableDrag={true}
              />
            </div>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-6 w-full py-2 bg-gray-800 text-gray-400 font-bold rounded hover:bg-gray-700 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
