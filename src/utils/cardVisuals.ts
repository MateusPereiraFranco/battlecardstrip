// src/utils/cardVisuals.ts
import { Card } from "../types/card";

export const getDynamicAssets = (card: Card) => {
  return {
    border: "/images/cardElements/borda.png",
    levelGem: "/images/cardElements/gemaCarta.png",
    manaFilled: "/images/cardElements/gemaGastoPreenchido.png",
    manaEmpty: "/images/cardElements/gemaGastoVazio.png",
    atkIcon: "/images/cardElements/chamas2.png",
    defIcon: "/images/cardElements/escudo.png",
  };
};

// 👇 2. Cores Neon do Level (Agora com Tamanho P e G)
export const getNivelNeonClass = (
  level: number,
  size: "sm" | "lg" = "sm",
): string => {
  if (size === "lg") {
    if (level <= 4)
      return "text-[#FFE4C4] [-webkit-text-stroke:1px_#4A2E1B] [text-shadow:0_3px_2px_rgba(0,0,0,0.8),0_0_15px_rgba(205,127,50,1)]";
    if (level <= 6)
      return "text-[#F8F8FF] [-webkit-text-stroke:1px_#2F4F4F] [text-shadow:0_3px_2px_rgba(0,0,0,0.8),0_0_15px_rgba(192,192,192,1)]";
    if (level <= 8)
      return "text-[#FFF8DC] [-webkit-text-stroke:1.5px_#8B6508] [text-shadow:0_3px_2px_rgba(0,0,0,0.8),0_0_20px_rgba(255,215,0,1)]";
    return "text-[#E0FFFF] [-webkit-text-stroke:1.5px_#00688B] [text-shadow:0_3px_2px_rgba(0,0,0,0.8),0_0_25px_rgba(0,255,255,1)]";
  } else {
    // SM: Borda de 0.5px para não engolir o texto pequeno
    if (level <= 4)
      return "text-[#FFE4C4] [-webkit-text-stroke:0.5px_#4A2E1B] [text-shadow:0_1px_2px_rgba(0,0,0,1),0_0_5px_rgba(205,127,50,1)]";
    if (level <= 6)
      return "text-[#F8F8FF] [-webkit-text-stroke:0.5px_#2F4F4F] [text-shadow:0_1px_2px_rgba(0,0,0,1),0_0_5px_rgba(192,192,192,1)]";
    if (level <= 8)
      return "text-[#FFF8DC] [-webkit-text-stroke:0.5px_#8B6508] [text-shadow:0_1px_2px_rgba(0,0,0,1),0_0_6px_rgba(255,215,0,1)]";
    return "text-[#E0FFFF] [-webkit-text-stroke:0.5px_#00688B] [text-shadow:0_1px_2px_rgba(0,0,0,1),0_0_8px_rgba(0,255,255,1)]";
  }
};

export const GLASS_CLIP_PATH =
  "polygon(3% 0, 97% 0, 100% 10%, 100% 90%, 97% 100%, 3% 100%, 0 90%, 0 10%)";

// 4. Cores e Contorno do ATK/DEF (Agora com Contraste Extremo)
export const getStatColorClass = (
  isBuffed: boolean,
  statType: "atk" | "def",
  size: "sm" | "lg" = "sm",
): string => {
  if (size === "lg") {
    if (statType === "atk") {
      return isBuffed
        ? // BUFFADO: Amarelo Ouro Vivo | Borda Marrom Escura Grossa | Sombra Preta Sólida + Brilho Vermelho
          "text-[#fbbf24] [-webkit-text-stroke:2.5px_#422006] [text-shadow:0_4px_4px_rgba(0,0,0,1),0_0_15px_rgba(220,38,38,1)]"
        : // NORMAL: Vermelho Claro/Rosado | Borda Vinho Quase Preta | Sombra Preta Sólida
          "text-[#ffcaca] [-webkit-text-stroke:2.5px_#3f0000] [text-shadow:0_4px_6px_rgba(0,0,0,1),0_0_10px_rgba(0,0,0,0.8)]";
    } else {
      return isBuffed
        ? // BUFFADO: Verde Menta | Borda Verde Escura Grossa | Sombra Preta Sólida + Brilho Esmeralda
          "text-[#a7f3d0] [-webkit-text-stroke:2.5px_#064e3b] [text-shadow:0_4px_4px_rgba(0,0,0,1),0_0_15px_rgba(16,185,129,1)]"
        : // NORMAL: Azul Claro | Borda Azul Marinho Escura | Sombra Preta Sólida
          "text-[#e0f2fe] [-webkit-text-stroke:2.5px_#082f49] [text-shadow:0_4px_6px_rgba(0,0,0,1)]";
    }
  } else {
    // TAMANHO SM (Miniaturas na Mesa/Mão) - Bordas finas mas muito escuras para leitura perfeita
    if (statType === "atk") {
      return isBuffed
        ? "text-[#fbbf24] [-webkit-text-stroke:1px_#422006] [text-shadow:0_2px_2px_rgba(0,0,0,1),0_0_6px_rgba(220,38,38,1)]"
        : "text-[#ffcaca] [-webkit-text-stroke:1px_#3f0000] [text-shadow:0_2px_2px_rgba(0,0,0,1)]";
    } else {
      return isBuffed
        ? "text-[#a7f3d0] [-webkit-text-stroke:1px_#064e3b] [text-shadow:0_2px_2px_rgba(0,0,0,1),0_0_6px_rgba(16,185,129,1)]"
        : "text-[#e0f2fe] [-webkit-text-stroke:1px_#082f49] [text-shadow:0_2px_2px_rgba(0,0,0,1)]";
    }
  }
};

export const getCardTypeLabel = (card: Card): string => {
  if ("attack" in card) {
    return `[ ${"race" in card ? card.race : "Normal"} ]`;
  }
  switch (card.cardType) {
    case "Spell":
      return "[ Mágica ]";
    case "EquipSpell":
      return "[ Equipamento ]";
    case "Trap":
      return "[ Armadilha ]";
    case "FieldSpell":
      return "[ Campo ]";
    default:
      return "[ Carta ]";
  }
};

// 6. Estilo do Nome da Carta (Fonte clássica, uma linha, contorno e sombra)
export const getCardNameClass = (size: "sm" | "lg" = "sm"): string => {
  if (size === "lg") {
    // Zoom da esquerda: Removido 'truncate' e 'w-full' para evitar bugs de alinhamento
    return "font-serif font-black text-white uppercase text-center tracking-wider [-webkit-text-stroke:1px_#000] [text-shadow:0_4px_6px_rgba(0,0,0,1),0_0_15px_rgba(255,255,255,0.4)]";
  } else {
    // Miniatura da mesa: Removido 'truncate' e adicionado 'break-words' como segurança
    return "font-sans font-black text-white uppercase text-center break-words tracking-tight [-webkit-text-stroke:0.5px_#000] [text-shadow:0_2px_3px_rgba(0,0,0,1),0_0_5px_rgba(255,255,255,0.4)]";
  }
};
