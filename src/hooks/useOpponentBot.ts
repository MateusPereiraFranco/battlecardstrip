// src/hooks/useOpponentBot.ts
import { useEffect } from "react";
import { Card } from "../types/card";
import { isValidEquipTarget, getEffectiveStats } from "../utils/rules";

interface OpponentBotProps {
  state: any;
  actions: any;
  uiState: any;
  uiCallbacks: any;
  personality?: "aggro" | "cautious" | "balanced"; // 👈 NOVA VARIÁVEL DE IA
}

export function useOpponentBot({
  state,
  actions,
  uiState,
  uiCallbacks,
  personality = "balanced", // O padrão é equilibrado
}: OpponentBotProps) {
  useEffect(() => {
    if (state.playerLP <= 0 || state.opponentLP <= 0) return;
    if (state.currentPlayer !== "opponent") return;
    if (
      uiState.pendingPrompt ||
      uiState.resolvingEffectId ||
      uiState.attackingAnimId
    )
      return;

    // 👇 Define o comportamento da IA
    const isAggro = personality === "aggro";
    const isCautious = personality === "cautious";

    const thinkTimer = setTimeout(() => {
      // ==========================================
      // FASE DE COMPRA
      // ==========================================
      if (state.currentPhase === "draw") {
        actions.drawOpponentCard();
        return;
      }

      // ==========================================
      // FASE PRINCIPAL (MAIN PHASE)
      // ==========================================
      if (state.currentPhase === "main") {
        const myMonsters = state.opponentMonsterZone.filter(
          (m: any) => m !== null,
        );
        const enemyMonsters = state.monsterZone.filter((m: any) => m !== null);

        const myStrongestAtk =
          myMonsters.length > 0
            ? Math.max(...myMonsters.map((m: any) => m.attack))
            : 0;

        const enemyStrongestAtk =
          enemyMonsters.length > 0
            ? Math.max(...enemyMonsters.map((m: any) => m.attack))
            : 0;

        // 1. PRIORIDADE: JOGAR CAMPO
        const fieldSpells = state.opponentHand.filter(
          (c: Card) => c.cardType === "FieldSpell",
        );
        if (fieldSpells.length > 0 && !state.opponentFieldSpell) {
          const fieldToPlay = fieldSpells[0];
          if (state.opponentMana >= fieldToPlay.manaCost) {
            actions.setOpponentMana(
              (prev: number) => prev - fieldToPlay.manaCost,
            );
            actions.setOpponentHand(
              state.opponentHand.filter((c: Card) => c.id !== fieldToPlay.id),
            );
            actions.setOpponentFieldSpell({
              ...fieldToPlay,
              isFaceDown: false,
              cardPosition: "attack",
            });
            return;
          }
        }

        // 2. PRIORIDADE: MÁGICAS E ARMADILHAS
        const playableSpells = state.opponentHand.filter((c: Card) => {
          if (c.cardType === "FieldSpell" || "attack" in c) return false;
          if (state.opponentMana < c.manaCost) return false;

          // 🧠 HEURÍSTICA: Buraco Negro Dimensional
          if (c.name.includes("Buraco Negro")) {
            const imLosingBoard = enemyMonsters.length > myMonsters.length;
            const imOutpowered = enemyStrongestAtk > myStrongestAtk;

            if (isCautious) {
              // Cauteloso só explode tudo se a situação estiver preta ou vida abaixo de 1000
              if (!imLosingBoard && !imOutpowered && state.opponentLP > 1000)
                return false;
            } else if (isAggro) {
              // Agressivo explode o campo se o inimigo tiver QUALQUER monstro
              if (enemyMonsters.length === 0) return false;
            } else {
              // Equilibrado
              if (!imLosingBoard && !imOutpowered) return false;
            }
          }

          // 🧠 HEURÍSTICA: Equipamentos
          if (c.cardType === "EquipSpell") {
            const hasValidTarget = myMonsters.some((m: any) =>
              isValidEquipTarget(c, m),
            );
            if (!hasValidTarget) return false;
          }

          return true;
        });

        if (
          playableSpells.length > 0 &&
          state.opponentSpellZone.some((s: any) => s === null)
        ) {
          uiCallbacks.handleOpponentPlaySpell(playableSpells[0]);
          return;
        }

        // 3. PRIORIDADE: INVOCAR MONSTROS
        if (!state.hasSummonedThisTurn) {
          const playableMonsters = state.opponentHand
            .filter((c: Card) => {
              if (!("attack" in c)) return false;
              if (state.opponentMana < c.manaCost) return false;

              const level = "level" in c ? c.level : 0;
              const tributesNeeded = level >= 7 ? 2 : level >= 5 ? 1 : 0;

              if (tributesNeeded === 0 && myMonsters.length >= 4) return false;
              if (tributesNeeded > 0 && myMonsters.length < tributesNeeded)
                return false;

              // 🧠 HEURÍSTICA: Tributos
              if (tributesNeeded > 0) {
                if (isCautious && c.attack < myStrongestAtk + 500) return false; // Cauteloso odeia sacrificar à toa
                if (!isAggro && c.attack <= myStrongestAtk) return false; // Padrão
              }

              return true;
            })
            .sort((a: any, b: any) => b.attack - a.attack);

          if (playableMonsters.length > 0) {
            uiCallbacks.handleOpponentSummon(playableMonsters[0]);
            return;
          }
        }

        actions.nextPhase(() => uiCallbacks.clearUIAttacks());
        return;
      }

      // ==========================================
      // FASE DE BATALHA (BATTLE PHASE)
      // ==========================================
      if (state.currentPhase === "battle") {
        const availableAttackers = state.opponentMonsterZone
          .map((card: Card | null, index: number) => ({ card, index }))
          .filter(
            (m: any) =>
              m.card !== null &&
              m.card.cardPosition === "attack" &&
              !state.attackedMonsters.includes(m.card.id),
          );

        if (availableAttackers.length > 0) {
          const attacker = availableAttackers[0];
          const myStats = getEffectiveStats(
            attacker.card!,
            [state.fieldSpell, state.opponentFieldSpell],
            actions.getMonsterEquips(attacker.card!.id),
          );
          const myAtk = myStats ? myStats.attack : attacker.card!.attack;

          const validTargets = state.monsterZone
            .map((card: Card | null, index: number) => ({ card, index }))
            .filter((m: any) => m.card !== null);

          if (validTargets.length === 0) {
            uiCallbacks.handleOpponentDirectAttack(attacker.index);
            return;
          } else {
            // Foca no elo mais fraco
            validTargets.sort((a: any, b: any) => {
              const aStats = getEffectiveStats(
                a.card!,
                [state.fieldSpell, state.opponentFieldSpell],
                actions.getMonsterEquips(a.card!.id),
              );
              const bStats = getEffectiveStats(
                b.card!,
                [state.fieldSpell, state.opponentFieldSpell],
                actions.getMonsterEquips(b.card!.id),
              );
              const aStat =
                a.card!.cardPosition === "attack"
                  ? aStats
                    ? aStats.attack
                    : a.card!.attack
                  : aStats
                    ? aStats.defense
                    : a.card!.defense;
              const bStat =
                b.card!.cardPosition === "attack"
                  ? bStats
                    ? bStats.attack
                    : b.card!.attack
                  : bStats
                    ? bStats.defense
                    : b.card!.defense;
              return aStat - bStat;
            });

            const target = validTargets[0];
            const targetStats = getEffectiveStats(
              target.card!,
              [state.fieldSpell, state.opponentFieldSpell],
              actions.getMonsterEquips(target.card!.id),
            );
            const targetScore =
              target.card!.cardPosition === "attack"
                ? targetStats
                  ? targetStats.attack
                  : target.card!.attack
                : targetStats
                  ? targetStats.defense
                  : target.card!.defense;

            // 🧠 HEURÍSTICA DE ATAQUE
            const canAttack = isCautious
              ? myAtk > targetScore // Cauteloso SÓ ataca se for sair vivo
              : myAtk >= targetScore; // Agressivo/Padrão ataca até se for pra empatar e morrer junto

            if (canAttack) {
              uiCallbacks.handleOpponentAttack(attacker.index, target.index);
            } else {
              actions.setAttackedMonsters((prev: string[]) => [
                ...prev,
                attacker.card!.id,
              ]);
            }
            return;
          }
        }
        actions.nextPhase(() => uiCallbacks.clearUIAttacks());
        return;
      }

      if (state.currentPhase === "end") {
        actions.nextPhase(() => uiCallbacks.clearUIAttacks());
        return;
      }
    }, 1500);

    return () => clearTimeout(thinkTimer);
  }, [
    state.playerLP,
    state.opponentLP,
    state.currentPlayer,
    state.currentPhase,
    state.hasSummonedThisTurn,
    state.attackedMonsters,
    uiState,
    state.opponentHand,
    state.opponentMonsterZone,
    state.monsterZone,
    state.opponentMana,
    state.opponentSpellZone,
    state.opponentFieldSpell,
    state.fieldSpell,
    actions,
    uiCallbacks,
    personality, // 👈 Dependência nova!
  ]);
}
