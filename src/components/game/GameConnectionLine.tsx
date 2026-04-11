// src/components/game/GameConnectionLine.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export interface GameLineProps {
  monsterId: string;
  targetId: string;
  isOpponent?: boolean;
  type?: "equip" | "attack";
  // 👇 NOVO: Gatilho profissional de "Impacto Confirmado"
  onComplete?: () => void;
}

export default function GameConnectionLine({
  monsterId,
  targetId,
  isOpponent,
  type = "equip",
  onComplete,
}: GameLineProps) {
  const [coords, setCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });

  // Impede que a animação de "saída" dispare o dano duas vezes
  const hasTriggered = useRef(false);

  useEffect(() => {
    const monsterElement = document.getElementById(monsterId);
    const targetElement = document.getElementById(targetId);

    if (monsterElement && targetElement) {
      const monsterRect = monsterElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      setCoords({
        x1: targetRect.left + targetRect.width / 2,
        y1: targetRect.top + targetRect.height / 2,
        x2: monsterRect.left + monsterRect.width / 2,
        y2: monsterRect.top + monsterRect.height / 2,
      });
    }
  }, [monsterId, targetId]);

  let lineColor = isOpponent ? "#ef4444" : "#22d3ee";
  if (type === "attack") lineColor = "#ef4444";

  return (
    <svg
      className="fixed inset-0 z-[80] pointer-events-none"
      width="100%"
      height="100%"
    >
      <motion.line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={lineColor}
        strokeWidth={type === "attack" ? "5" : "3"}
        strokeDasharray={type === "attack" ? "10 5" : "5 5"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        exit={{ opacity: 0 }}
        // 👇 Animação firme e rápida (400ms)
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 8px ${lineColor})` }}
        // 👇 O SEGREDO DO SUCESSO: Avisa a tela no milissegundo exato que a linha chega ao alvo
        onAnimationComplete={() => {
          if (!hasTriggered.current && onComplete) {
            hasTriggered.current = true;
            onComplete();
          }
        }}
      />
    </svg>
  );
}
