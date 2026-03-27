// src/utils/rules.ts
import { Card } from "../types/card";

export const getEffectiveStats = (card: Card, fieldSpell: Card | null) => {
  if (!("attack" in card)) return null;

  let currentAtk = card.attack;
  let currentDef = card.defense;

  // === TRAVA DE SEGURANÇA 1: A carta alvo está virada para baixo? ===
  // Se estiver virada para baixo, ela não recebe nenhum buff, pois sua identidade é secreta.
  if (card.isFaceDown) {
    return {
      attack: currentAtk,
      defense: currentDef,
      isBuffed: false,
    };
  }

  // === MOTOR DE EFEITOS ===

  // === TRAVA DE SEGURANÇA 2: O Campo de Magia está ativo (virado para cima)? ===
  if (fieldSpell && !fieldSpell.isFaceDown) {
    // Efeito do Campo de Trincheira
    if (fieldSpell.name === "Campo de Trincheira") {
      if (card.race === "Soldado") {
        currentAtk += 200;
        currentDef += 200;
      }
    }
  }

  return {
    attack: currentAtk,
    defense: currentDef,
    isBuffed: currentAtk > card.attack || currentDef > card.defense,
  };
};

// 🧑‍⚖️ JUÍZ 1: Verifica se a mágica de equipamento pode ser equipada neste monstro
// 🧑‍⚖️ JUÍZ 1: Verifica se a mágica de equipamento pode ser equipada neste monstro
export const isValidEquipTarget = (
  equipCard: Card,
  targetCard: Card | null, // 👇 Agora o juiz aceita analisar espaços vazios
): boolean => {
  // 👇 Se o espaço estiver vazio (null) ou a carta não tiver ataque, ele descarta imediatamente
  if (!targetCard || !("attack" in targetCard)) return false;

  // Transformamos tudo em minúsculo para evitar bugs de digitação no banco de dados!
  const targetName = targetCard.name.toLowerCase();
  const targetRace =
    "race" in targetCard && targetCard.race
      ? targetCard.race.toLowerCase()
      : "";

  switch (equipCard.name) {
    case "Canhão de Trincheira Amaldiçoado":
      // Checa se o nome tem "soldado" ou a raça é "soldado"
      return targetName.includes("soldado") || targetRace === "soldado";

    // Exemplo de como escalar no futuro:
    // case "Espada Lendária":
    //   return targetRace === "guerreiro";

    default:
      return true; // Equipamentos comuns podem ir em qualquer monstro
  }
};

// 🗡️ Fornece os status dinâmicos do equipamento
export const getEquipBuff = (equipCard: Card): { atk: number; def: number } => {
  switch (equipCard.name) {
    case "Canhão de Trincheira Amaldiçoado":
      return { atk: 400, def: 0 };
    // case "Escudo Místico":
    //   return { atk: 0, def: 500 };
    default:
      return { atk: 0, def: 0 };
  }
};
