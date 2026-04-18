// src/components/game/modals/SpecialSummonModal.tsx
import React, { useState } from "react";
import CardView from "../CardView";
import { Card } from "../../../types/card";

interface SpecialSummonModalProps {
  data: {
    message: string;
    validCards: Card[];
    // 👇 AGORA EXIGE A CARTA E A POSIÇÃO!
    onSelect: (card: Card, position: "attack" | "defense") => void;
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
  // 👇 NOVO ESTADO: Segura a carta clicada para perguntar a posição
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  if (!data) return null;

  const handTargets = data.validCards.filter((c) =>
    hand.some((h) => h.id === c.id),
  );
  const gyTargets = data.validCards.filter((c) =>
    graveyard.some((g) => g.id === c.id),
  );

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[9960] flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border-2 border-emerald-500 p-6 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] relative overflow-hidden">
        {/* 👇 NOVA TELA DE SOBREPOSIÇÃO: Pergunta a posição de batalha 👇 */}
        {selectedCard && (
          <div className="absolute inset-0 bg-gray-900/95 z-50 flex flex-col items-center justify-center rounded-xl p-6 backdrop-blur-md">
            <h3 className="text-emerald-400 font-bold text-3xl mb-12 uppercase tracking-widest text-center drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
              Posição de Batalha
              <br />
              <span className="text-white text-xl">[{selectedCard.name}]</span>
            </h3>

            <div className="flex gap-12">
              <button
                onClick={() => {
                  data.onSelect(selectedCard, "attack");
                  setSelectedCard(null);
                }}
                className="flex flex-col items-center justify-center bg-blue-900/50 hover:bg-blue-600 border-2 border-blue-500 w-40 h-40 rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                <div className="w-10 h-16 border-2 border-white bg-blue-400 mb-4 shadow-lg"></div>
                <span className="text-white font-bold text-xl uppercase tracking-wider">
                  Ataque
                </span>
              </button>

              <button
                onClick={() => {
                  data.onSelect(selectedCard, "defense");
                  setSelectedCard(null);
                }}
                className="flex flex-col items-center justify-center bg-gray-800/80 hover:bg-gray-600 border-2 border-gray-400 w-40 h-40 rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(156,163,175,0.4)]"
              >
                <div className="w-16 h-10 border-2 border-white bg-blue-400 mb-4 shadow-lg"></div>
                <span className="text-white font-bold text-xl uppercase tracking-wider">
                  Defesa
                </span>
              </button>
            </div>

            <button
              onClick={() => setSelectedCard(null)}
              className="mt-16 text-gray-400 hover:text-white hover:underline transition-colors uppercase tracking-widest text-sm"
            >
              Voltar e escolher outra carta
            </button>
          </div>
        )}
        {/* 👆 FIM DA TELA DE SOBREPOSIÇÃO 👆 */}

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
                    onClick={() => setSelectedCard(c)} // 👈 AGORA ABRE A TELA DE ESCOLHA EM VEZ DE INVOCAR DIRETO
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
                    onClick={() => setSelectedCard(c)} // 👈 MESMA COISA AQUI
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
