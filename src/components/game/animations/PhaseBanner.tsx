// src/components/game/animations/PhaseBanner.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";

interface PhaseBannerProps {
  text: string;
  color: string;
  onComplete: () => void;
}

export default function PhaseBanner({
  text,
  color,
  onComplete,
}: PhaseBannerProps) {
  useEffect(() => {
    // O banner some sozinho depois de 1.5 segundos
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Faixa de fundo preta inclinada (Estilo Anime) */}
      <motion.div
        initial={{ x: "-100%", skewX: -15, opacity: 0 }}
        animate={{ x: 0, skewX: -15, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute w-[120%] h-40 bg-black/10 border-y-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md"
        style={{ borderColor: color }}
      />

      {/* Texto Gigante rasgando a tela */}
      <motion.div
        initial={{ scale: 3, opacity: 0, x: -100 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.5, opacity: 0, x: 100 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="relative z-10 text-center"
      >
        <h1
          className="text-6xl md:text-8xl font-black italic tracking-[0.1em] uppercase"
          style={{
            color: "white",
            textShadow: `0 0 20px ${color}, 4px 4px 0px ${color}`,
          }}
        >
          {text}
        </h1>
      </motion.div>
    </div>
  );
}
