// src/components/game/animations/FloatingDamage.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";

interface FloatingDamageProps {
  amount: number;
  onComplete: () => void;
}

export default function FloatingDamage({
  amount,
  onComplete,
}: FloatingDamageProps) {
  useEffect(() => {
    // Remove a animação da tela depois de 1.2 segundos
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -100, scale: 1.8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-[9999] text-red-500 font-black text-6xl drop-shadow-[0_0_15px_rgba(220,38,38,1)] pointer-events-none font-mono"
    >
      -{amount}
    </motion.div>
  );
}
