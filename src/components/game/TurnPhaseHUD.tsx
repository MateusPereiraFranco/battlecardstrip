// src/components/game/TurnPhaseHUD.tsx
import React from "react";

interface TurnPhaseHUDProps {
  currentTurn: number;
  currentPlayer: string;
  currentPhase: string;
  onNextPhase: () => void;
  isDisabled: boolean;
}

export default function TurnPhaseHUD({
  currentTurn,
  currentPlayer,
  currentPhase,
  onNextPhase,
  isDisabled,
}: TurnPhaseHUDProps) {
  return (
    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 items-center z-40 pointer-events-none w-28">
      {/* Turno Atual */}
      <div className="bg-gray-900 border-2 border-gray-600 rounded-lg p-3 text-center shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto w-full">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
          Turno
        </div>
        <div className="text-4xl font-black text-white font-mono leading-none">
          {currentTurn}
        </div>
      </div>

      {/* Jogador Atual */}
      <div
        className={`w-full text-center text-[10px] font-bold uppercase tracking-widest py-2 px-2 rounded border-2 transition-all duration-500 pointer-events-auto ${
          currentPlayer === "player"
            ? "bg-blue-900/90 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            : "bg-red-900/90 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
        }`}
      >
        {currentPlayer === "player" ? "Sua Vez" : "Oponente"}
      </div>

      {/* Lista de Fases */}
      <div className="flex flex-col gap-1 w-full mt-2 pointer-events-auto">
        {["draw", "main", "battle", "end"].map((phase) => (
          <div
            key={phase}
            className={`text-center py-1 px-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
              currentPhase === phase
                ? "bg-yellow-500 text-black border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.8)] scale-110 z-10"
                : "bg-gray-800 text-gray-500 border-gray-700 opacity-50"
            }`}
          >
            {phase}
          </div>
        ))}
      </div>

      {/* Botão Próxima Fase */}
      <button
        onClick={onNextPhase}
        disabled={isDisabled}
        className={`mt-2 border-2 font-black uppercase tracking-widest py-3 px-2 rounded-xl transition-all pointer-events-auto shadow-xl flex flex-col items-center justify-center gap-1 w-full ${
          isDisabled || currentPhase === "draw"
            ? "bg-gray-900 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed"
            : "bg-gray-800 hover:bg-gray-700 border-gray-500 hover:border-white text-gray-300 hover:text-white active:scale-95"
        }`}
      >
        <span className="text-[10px] text-gray-400">
          {currentPhase === "end" ? "Passar" : "Próxima"}
        </span>
        <span className="text-sm leading-none">
          {currentPhase === "end" ? "Turno" : "Fase"}
        </span>
      </button>
    </div>
  );
}
