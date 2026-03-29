// src/utils/rules.ts
import { Card } from "../types/card";

export const getEffectiveStats = (
  card: Card,
  activeFieldSpells: (Card | null)[],
  equipments: (Card | null)[] = [],
) => {
  // Se não for monstro, não tem status
  if (!("attack" in card)) return null;

  // === TRAVA DE SEGURANÇA: O monstro está virado para baixo? ===
  // Se estiver virado para baixo, a identidade é secreta e não ganha buff
  if (card.isFaceDown) {
    return {
      attack: card.attack,
      defense: card.defense,
      isBuffed: false,
    };
  }

  let finalAtk = card.attack;
  let finalDef = card.defense;

  // --- Processa os Campos ---
  // Filtra os campos válidos (existem e estão virados para cima)
  const validFieldSpells = activeFieldSpells.filter(
    (s) => s !== null && !s.isFaceDown,
  ) as Card[];

  // O Motor passa por cada campo ativo na mesa e aplica a matemática!
  validFieldSpells.forEach((spell) => {
    // Efeito do Campo de Trincheira
    if (spell.name.includes("Trincheira") && card.race === "Soldado") {
      finalAtk += 200;
      finalDef += 200;
    }
  });

  const validEquips = equipments.filter(
    (e) => e !== null && e.cardType === "EquipSpell" && !e.isFaceDown,
  ) as Card[];

  validEquips.forEach((equip) => {
    const buff = getEquipBuff(equip);
    finalAtk += buff.atk;
    finalDef += buff.def;
  });

  // 👇 3. O bônus azul aparece se QUALQUER bônus estiver ativo!
  return {
    attack: finalAtk,
    defense: finalDef,
    isBuffed: finalAtk > card.attack || finalDef > card.defense,
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

// 🪤 DETECTOR DE ARMADILHAS (Gatilho de Invocação)
export const checkSummonTraps = (
  summonedCard: Card,
  enemySpellZone: (Card | null)[],
) => {
  const trapIndex = enemySpellZone.findIndex(
    (c) => c !== null && c.isFaceDown && c.cardType === "Trap",
  );

  if (trapIndex !== -1) {
    const trapCard = enemySpellZone[trapIndex]!;

    // Efeito da Mina Terrestre
    if (trapCard.name.includes("Mina Terrestre") && !summonedCard.isFaceDown) {
      // 👇 O MOTOR DITA AS ORDENS EXATAS DO QUE DEVE ACONTECER!
      return {
        triggered: true,
        trapIndex,
        trapCard,
        effect: {
          message: `CUIDADO! O oponente ativou a armadilha oculta: ${trapCard.name}!\nSeu monstro foi destruído na mesma hora!`,
          destroyMonster: true,
          destroyTrap: true,
        },
      };
    }

    // Futuro: Efeito do "Buraco Armadilha Sem Fundo" (Bane o monstro)
    // if (trapCard.name.includes("Sem Fundo") && summonedCard.attack >= 1500) {
    //   return { triggered: true, trapIndex, trapCard, effect: { message: "Seu monstro caiu no buraco e foi banido!", banishMonster: true, destroyTrap: true } };
    // }
  }

  return { triggered: false };
};
