// src/components/modals/SpecialSummonModal.tsx
import React from "react";
import CardView from "../CardView";
import { Card } from "../../../types/card";

interface SpecialSummonModalProps {
  data: {
    message: string;
    validCards: Card[];
    onSelect: (card: Card) => void;
  } | null;
  hand: Card[];
  graveyard: Card[];
  onClose: () => void;
}

export default function SpecialSummonModal({
  data,
  hand,
  graveyard,
  onClose,
}: SpecialSummonModalProps) {
  if (!data) return null;

  // Filtra as cartas que estão na mão ou no cemitério
  const handTargets = data.validCards.filter((c) =>
    hand.some((h) => h.id === c.id),
  );
  const gyTargets = data.validCards.filter((c) =>
    graveyard.some((g) => g.id === c.id),
  );

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[9960] flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border-2 border-emerald-500 p-6 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
        <h2 className="text-emerald-400 font-bold text-2xl mb-6 text-center uppercase tracking-widest">
          {data.message}
        </h2>

        <div className="flex gap-6 w-full overflow-hidden flex-1">
          {/* PAINEL DA MÃO */}
          <div className="flex-1 border-2 border-emerald-700/50 bg-emerald-900/20 rounded-xl p-4 flex flex-col">
            <h3 className="text-emerald-400 font-bold text-lg mb-4 text-center border-b border-emerald-700/50 pb-2">
              ✋ DA MÃO
            </h3>
            <div className="flex flex-wrap gap-4 justify-center overflow-y-auto p-2 flex-1 content-start">
              {handTargets.map((c, i) => (
                <div
                  key={`special-hand-${c.id}-${i}`}
                  className="hover:scale-110 transition-transform cursor-pointer drop-shadow-lg"
                >
                  <CardView
                    card={c}
                    onClick={() => data.onSelect(c)}
                    disableDrag={true}
                  />
                </div>
              ))}
              {handTargets.length === 0 && (
                <span className="text-emerald-700/50 italic text-sm mt-10">
                  Nenhum soldado disponível.
                </span>
              )}
            </div>
          </div>

          {/* PAINEL DO CEMITÉRIO */}
          <div className="flex-1 border-2 border-purple-700/50 bg-purple-900/20 rounded-xl p-4 flex flex-col">
            <h3 className="text-purple-400 font-bold text-lg mb-4 text-center border-b border-purple-700/50 pb-2">
              🪦 DO CEMITÉRIO
            </h3>
            <div className="flex flex-wrap gap-4 justify-center overflow-y-auto p-2 flex-1 content-start">
              {gyTargets.map((c, i) => (
                <div
                  key={`special-gy-${c.id}-${i}`}
                  className="hover:scale-110 transition-transform cursor-pointer drop-shadow-lg"
                >
                  <CardView
                    card={c}
                    onClick={() => data.onSelect(c)}
                    disableDrag={true}
                  />
                </div>
              ))}
              {gyTargets.length === 0 && (
                <span className="text-purple-700/50 italic text-sm mt-10">
                  Nenhum soldado no cemitério.
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-gray-800 text-gray-300 font-bold uppercase tracking-widest rounded-lg hover:bg-red-900 hover:text-white border border-gray-700 hover:border-red-500 transition-all"
        >
          Cancelar Invocação
        </button>
      </div>
    </div>
  );
}
