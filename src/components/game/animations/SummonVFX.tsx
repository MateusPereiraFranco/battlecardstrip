// src/components/game/animations/SummonVFX.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { playSFX } from "../../../utils/audio";

interface SummonVFXProps {
  x: number;
  y: number;
  color?: string;
  soundType?: "summonMonster" | "summonSpell"; // 👈 NOVO: Recebe o tipo de som!
  onComplete: () => void;
}

export default function SummonVFX({
  x,
  y,
  color = "#3b82f6",
  soundType = "summonMonster", // 👈 Por padrão é monstro
  onComplete,
}: SummonVFXProps) {
  useEffect(() => {
    // 👇 Agora ele toca o som exato que a tela mandar!
    playSFX(soundType);
  }, [soundType]);

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ left: x, top: y }}
    >
      {/* Anel mágico que se expande no "chão" */}
      <motion.div
        initial={{ scale: 0.2, opacity: 1, rotateX: 70, borderWidth: "15px" }}
        animate={{ scale: 3, opacity: 0, borderWidth: "1px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute -ml-24 -mt-24 w-48 h-48 rounded-full"
        style={{
          borderColor: color,
          boxShadow: `0 0 30px ${color}, inset 0 0 30px ${color}`,
        }}
        onAnimationComplete={onComplete}
      />

      {/* Pilar de luz vertical que sobe da carta */}
      <motion.div
        initial={{ scaleY: 0, scaleX: 0.2, opacity: 1 }}
        animate={{ scaleY: 1.5, scaleX: 2, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute -ml-8 -mt-32 w-16 h-64 rounded-full origin-bottom"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 40px ${color}`,
        }}
      />
    </div>
  );
}
