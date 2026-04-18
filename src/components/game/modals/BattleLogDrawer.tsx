// src/components/game/modals/BattleLogDrawer.tsx
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogEntry } from "../../../hooks/useGameEngine";

interface BattleLogDrawerProps {
  isOpen: boolean;
  logs: LogEntry[];
  onCardClick?: (cardName: string) => void;
  onClose: () => void;
}

export default function BattleLogDrawer({
  isOpen,
  logs,
  onClose,
  onCardClick,
}: BattleLogDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const getLogStyle = (log: LogEntry) => {
    if (log.actionType === "phase")
      return "bg-purple-900/40 border-purple-500 text-purple-200 text-center justify-center font-black uppercase tracking-widest text-xs py-2";
    if (log.actionType === "damage")
      return "bg-red-900/20 border-red-500 text-red-200";
    if (log.player === "player")
      return "bg-blue-900/20 border-blue-500 text-blue-100";
    if (log.player === "opponent")
      return "bg-orange-900/20 border-orange-500 text-orange-100";
    return "bg-gray-800 border-gray-500 text-gray-300";
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "summon":
        return "⚔️";
      case "spell":
        return "✨";
      case "attack":
        return "💥";
      case "damage":
        return "🩸";
      default:
        return "";
    }
  };

  // 👇 MÁGICA VISUAL: Transforma [Nome da Carta] em texto Amarelo brilhante
  const renderMessage = (msg: string) => {
    const parts = msg.split(/(\[.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const cardName = part.slice(1, -1);
        return (
          <span
            key={i}
            onClick={() => onCardClick && onCardClick(cardName)}
            className="text-yellow-400 font-bold tracking-wide drop-shadow-[0_0_2px_rgba(250,204,21,0.8)] cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 👇 AJUSTE: Fundo agora é Transparente! Você vê o jogo rolando no fundo. */}
          <div
            onClick={onClose}
            className="fixed inset-0 z-[99998] bg-transparent"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[380px] bg-slate-950/90 border-l-4 border-blue-600 z-[99999] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] flex flex-col backdrop-blur-md"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>📜</span> Histórico de Batalha
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white font-black text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar"
            >
              {logs.length === 0 ? (
                <p className="text-gray-500 italic text-center mt-10">
                  O duelo acabou de começar...
                </p>
              ) : (
                logs.map((log) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log.id}
                    className={`border-l-4 rounded-r-md p-3 text-sm shadow-md flex gap-2 ${getLogStyle(log)}`}
                  >
                    {log.actionType !== "phase" && (
                      <span className="shrink-0">
                        {getLogIcon(log.actionType)}
                      </span>
                    )}
                    <div className="flex-1">
                      {log.actionType !== "phase" && (
                        <span className="font-bold opacity-70 text-[10px] uppercase block mb-1">
                          Turno {log.turn} •{" "}
                          {log.player === "player" ? "Você" : "Oponente"}
                        </span>
                      )}
                      <span
                        className={`${log.actionType === "phase" ? "" : "leading-tight block"}`}
                      >
                        {renderMessage(log.message)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
