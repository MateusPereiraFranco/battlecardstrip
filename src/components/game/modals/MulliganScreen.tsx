// src/components/game/modals/MulliganScreen.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../../types/card";
import CardView from "../CardView";
import { playSFX } from "../../../utils/audio";

interface MulliganScreenProps {
  hand: Card[];
  onConfirm: (swapIds: string[]) => void;
  onStartShuffle: () => void; // 👈 Novo sinal para a tela principal
}

export default function MulliganScreen({
  hand,
  onConfirm,
  onStartShuffle,
}: MulliganScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true); // 1. Remove o fundo preto e inicia o voo das cartas

    if (selectedIds.length > 0) {
      // 2. Espera 500ms (O tempo exato das cartas baterem no deck lá no canto)
      setTimeout(() => {
        onStartShuffle(); // 3. Avisa o page.tsx para iniciar a animação de Corte e tocar o som

        // 4. Espera os 2 segundos do embaralhamento terminar
        setTimeout(() => {
          onConfirm(selectedIds); // 5. Libera o motor para apagar as antigas e puxar as novas!
        }, 2000);
      }, 500);
    } else {
      onConfirm([]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // 👇 MÁGICA: O fundo e o blur somem assim que você clica em confirmar!
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-all duration-500 ${
        isConfirmed
          ? "bg-transparent backdrop-blur-none"
          : "bg-black/95 backdrop-blur-sm"
      }`}
    >
      <AnimatePresence>
        {!isConfirmed && (
          <motion.div exit={{ opacity: 0, y: -20 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase italic tracking-tighter">
              Mão Inicial
            </h1>
            <p className="text-gray-400 text-lg mb-12">
              Escolha quais cartas devolver ao deck
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6 justify-center items-center mb-16 relative">
        {hand.map((card, index) => {
          const isSelected = selectedIds.includes(card.id);
          return (
            <motion.div
              key={card.id}
              animate={{
                // 👇 Se confirmou e está selecionada, voa pro deck (Canto inferior direito)
                y: isConfirmed && isSelected ? 400 : isSelected ? -30 : 0,
                x: isConfirmed && isSelected ? 400 : 0,
                scale: isConfirmed && isSelected ? 0.3 : 1,
                opacity: isConfirmed && isSelected ? 0 : 1,
                rotate: isConfirmed && isSelected ? 90 : 0,
              }}
              transition={{ duration: 0.5, ease: "backIn" }}
              className="cursor-pointer relative"
              onClick={() =>
                !isConfirmed &&
                setSelectedIds((prev) =>
                  prev.includes(card.id)
                    ? prev.filter((id) => id !== card.id)
                    : [...prev, card.id],
                )
              }
            >
              <CardView card={card} disableDrag={true} />
              {isSelected && !isConfirmed && (
                <div className="absolute -inset-2 border-4 border-blue-500 rounded-lg animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>

      {!isConfirmed && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={handleConfirm}
          className="bg-blue-600 px-12 py-4 rounded-full font-black text-xl shadow-[0_0_20px_rgba(37,99,235,0.5)]"
        >
          {selectedIds.length > 0
            ? `TROCAR ${selectedIds.length}`
            : "MANTER MÃO"}
        </motion.button>
      )}
    </motion.div>
  );
}
