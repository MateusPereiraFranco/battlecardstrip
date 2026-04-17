// src/components/game/animations/GameOverScreen.tsx
import React from "react";
import { motion } from "framer-motion";

interface GameOverScreenProps {
  winner: "player" | "opponent";
  onRestart: () => void;
}

export default function GameOverScreen({
  winner,
  onRestart,
}: GameOverScreenProps) {
  const isVictory = winner === "player";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        // Efeito de "mola" pesada na hora que o texto aparece
        transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 10 }}
        className="text-center flex flex-col items-center"
      >
        {/* Letreiro Gigante */}
        <h1
          className={`text-7xl md:text-9xl font-black uppercase tracking-[0.2em] mb-4 ${
            isVictory ? "text-yellow-400" : "text-red-600"
          }`}
          style={{
            textShadow: isVictory
              ? "0 0 40px rgba(250,204,21,0.6), 0 0 80px rgba(250,204,21,0.4)"
              : "0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.8)",
          }}
        >
          {isVictory ? "Vitória" : "Derrota"}
        </h1>

        {/* Frase de efeito (Lore) */}
        <p className="text-gray-300 text-xl md:text-2xl font-serif italic mb-12 drop-shadow-md">
          {isVictory
            ? "O inimigo foi completamente esmagado perante o seu poder."
            : "Suas defesas caíram e suas forças foram aniquiladas."}
        </p>

        {/* Botão de Jogar Novamente com Hover animado */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRestart}
          className={`px-8 py-4 rounded-full font-bold text-xl uppercase tracking-widest transition-all ${
            isVictory
              ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)]"
              : "bg-red-700 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)]"
          }`}
        >
          Jogar Novamente
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
