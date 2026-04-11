// src/components/game/animations/HitExplosion.tsx
import React from "react";
import { motion } from "framer-motion";

interface HitExplosionProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export default function HitExplosion({ x, y, onComplete }: HitExplosionProps) {
  return (
    // Centraliza a explosão exatamente na coordenada (X,Y) do alvo
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ left: x, top: y }}
    >
      {/* Brilho central (O Clarão do impacto) */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute -ml-16 -mt-16 w-32 h-32 bg-white rounded-full blur-md"
        onAnimationComplete={onComplete} // Avisa quando a explosão sumiu
      />

      {/* Onda de choque (Anel de Fogo) */}
      <motion.div
        initial={{ scale: 0.2, opacity: 1, borderWidth: "20px" }}
        animate={{ scale: 3, opacity: 0, borderWidth: "0px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute -ml-16 -mt-16 w-32 h-32 rounded-full border-orange-500 shadow-[0_0_30px_rgba(249,115,22,1)]"
      />
    </div>
  );
}
