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
      finalAtk += 2;
      finalDef += 2;
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
export const isValidEquipTarget = (
  equipCard: Card,
  targetCard: Card | null, // 👇 Agora o juiz aceita analisar espaços vazios
): boolean => {
  // 👇 Se o espaço estiver vazio (null) ou a carta não tiver ataque, ele descarta imediatamente
  if (!targetCard || !("attack" in targetCard) || targetCard.isFaceDown) {
    return false;
  }

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
      return { atk: 4, def: 0 };
    // case "Escudo Místico":
    //   return { atk: 0, def: 500 };
    default:
      return { atk: 0, def: 0 };
  }
};

export type GameEvent =
  | "ON_SUMMON"
  | "ON_ATTACK"
  | "ON_SPELL_ACTIVATION"
  | "ON_TRAP_ACTIVATION";
// 🪤 DETECTOR DE ARMADILHAS (Atualizado com Condição de Campo)

export const checkTriggers = (
  event: GameEvent,
  triggeringCard: Card,
  playerMonsterZone: (Card | null)[],
  oppMonsterZone: (Card | null)[],
  enemySpellZone: (Card | null)[],
  activeFieldSpells: (Card | null)[],
) => {
  const validTraps = enemySpellZone
    .map((c, index) => ({ card: c, index }))
    .filter(
      (t) => t.card !== null && t.card.isFaceDown && t.card.cardType === "Trap",
    );
  const validFieldSpells = activeFieldSpells.filter(
    (s) => s !== null && !s.isFaceDown,
  ) as Card[];

  for (const trap of validTraps) {
    const trapCard = trap.card!;

    // 🪤 GATILHO 1: INVOCAR MONSTRO (Mina Terrestre)
    if (
      event === "ON_SUMMON" &&
      trapCard.name.includes("Mina Terrestre") &&
      !triggeringCard.isFaceDown
    ) {
      const isTrincheiraActive = activeFieldSpells.some(
        (s) => s !== null && !s.isFaceDown && s.name.includes("Trincheira"),
      );
      if (isTrincheiraActive) {
        return {
          triggered: true,
          trapIndex: trap.index,
          trapCard,
          effect: {
            message: `O oponente invocou ${triggeringCard.name}. Deseja ativar a ${trapCard.name} oculta na Trincheira?`,
            destroyTriggeringCard: true,
            destroyTrap: true,
            negateActivation: false,
          },
        };
      }
    }

    // 🪤 GATILHO 2: ATIVAÇÃO DE MÁGICAS E ARMADILHAS
    if (event === "ON_SPELL_ACTIVATION") {
      if (trapCard.name.includes("Anulador Mágico")) {
        return {
          triggered: true,
          trapIndex: trap.index,
          trapCard,
          effect: {
            message: `O oponente ativou a Mágica [${triggeringCard.name}]. Deseja usar ${trapCard.name} para anular e destruir?`,
            destroyTriggeringCard: true,
            destroyTrap: true,
            negateActivation: true,
          },
        };
      }
    }

    // 🪤 GATILHO 3: ATAQUE (Kamikaze)
    if (event === "ON_ATTACK") {
      if (trapCard.name.includes("Kamikaze")) {
        const isTrincheiraActive = validFieldSpells.some((s) =>
          s.name.includes("Trincheira"),
        );

        // 👇 CORREÇÃO DO ERRO: Usando "race" in m para o TypeScript não chorar!
        const hasSoldier = oppMonsterZone.some(
          (m) =>
            m !== null && !m.isFaceDown && "race" in m && m.race === "Soldado",
        );

        if (isTrincheiraActive && hasSoldier) {
          return {
            triggered: true,
            trapIndex: trap.index,
            trapCard,
            effect: {
              message: `O monstro [${triggeringCard.name}] declarou um ataque! Deseja ativar ${trapCard.name} para realizar um ataque suicida?`,
              destroyTriggeringCard: true,
              destroyTrap: true,
              negateActivation: true,
              requiresSelfMonsterDestruction: true,
            },
          };
        }
      }
    }
  }

  return { triggered: false };
};

// 🐉 JUÍZ 3: Efeitos de Monstros ao serem Invocados
export const checkMonsterSummonEffect = (summonedCard: Card) => {
  // Se for baixado virado para baixo, efeitos não ativam!
  if (summonedCard.isFaceDown) return { hasEffect: false };

  // EFEITO 1: Batedor da Trincheira (Busca cartas no deck)
  if (summonedCard.name.includes("Batedor da Trincheira")) {
    return {
      hasEffect: true,
      type: "SEARCH_DECK",
      message:
        "Efeito do Batedor! Escolha um reforço para adicionar à sua mão:",
      filter: (c: Card) => {
        const isSoldado = "race" in c && c.race === "Soldado";
        const isTrincheira = c.name.includes("Trincheira");
        const isMina = c.name.includes("Mina Terrestre");
        const isCanhao = c.name.includes("Canhão");
        return isSoldado || isTrincheira || isMina || isCanhao;
      },
    };
  }

  // Futuros monstros entram aqui...

  return { hasEffect: false };
};

// 🐉 JUÍZ 4: Efeitos de Monstros Ativados (Main Phase)
export const checkMonsterActivatedEffect = (card: Card, handCount: number) => {
  if (card.name.includes("Cavador da Trincheira")) {
    return {
      canActivate: handCount > 0, // Precisa ter carta na mão para descartar!
      message: "Efeito do Cavador: Descarte 1 carta para buscar um reforço.",
      actionType: "DISCARD_TO_SEARCH",
      filter: (c: Card) => {
        const isSoldado = "race" in c && c.race === "Soldado";
        const isTrincheira = c.name.includes("Trincheira");
        return isSoldado || isTrincheira;
      },
    };
  }
  return { canActivate: false };
};

// 🐉 JUÍZ 5: Efeitos de Mudança de Posição (Defesa para Ataque)
export const checkPositionChangeEffect = (
  card: Card,
  activeFieldSpells: (Card | null)[],
  isMonsterZoneFull: boolean,
  hand: Card[],
  graveyard: Card[],
) => {
  if (card.name.includes("Sentinela da Trincheira")) {
    const isTrincheiraActive = activeFieldSpells.some(
      (s) => s !== null && !s.isFaceDown && s.name.includes("Trincheira"),
    );

    if (isTrincheiraActive && !isMonsterZoneFull) {
      const targets = [...hand, ...graveyard].filter(
        (c) => "race" in c && c.race === "Soldado",
      );

      if (targets.length > 0) {
        return {
          hasEffect: true,
          targets,
          message:
            "Efeito de Posição: A Sentinela se levantou! Invoque um Soldado da mão ou cemitério!",
        };
      }
    }
  }
  return { hasEffect: false };
};
