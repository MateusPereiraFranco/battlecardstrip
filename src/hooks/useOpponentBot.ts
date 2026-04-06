// src/hooks/useOpponentBot.ts
import { useEffect } from "react";
import { Card } from "../types/card";
import {
  checkMonsterActivatedEffect,
  isValidEquipTarget,
} from "../utils/rules";

interface OpponentBotProps {
  state: any;
  actions: any;
  uiState: any;
  uiCallbacks: any;
}

export function useOpponentBot({
  state,
  actions,
  uiState,
  uiCallbacks,
}: OpponentBotProps) {
  useEffect(() => {
    if (state.currentPlayer !== "opponent") return;
    if (
      uiState.pendingPrompt ||
      uiState.resolvingEffectId ||
      uiState.attackingAnimId
    )
      return;

    const thinkTimer = setTimeout(() => {
      if (state.currentPhase === "draw") {
        actions.drawOpponentCard();
        return;
      }

      if (state.currentPhase === "main") {
        const fieldSpells = state.opponentHand.filter(
          (c: Card) => c.cardType === "FieldSpell",
        );

        // 👇 ATUALIZADO: Verifica se tem mana para pagar o Campo específico
        if (fieldSpells.length > 0 && !state.opponentFieldSpell) {
          const fieldToPlay = fieldSpells[0];

          if (state.opponentMana >= fieldToPlay.manaCost) {
            actions.setOpponentMana(
              (prev: number) => prev - fieldToPlay.manaCost,
            ); // 👈 Desconta o custo real
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

        const playableSpells = state.opponentHand.filter((c: Card) => {
          // Ignora campos, monstros e cartas mais caras que a mana atual
          if (c.cardType === "FieldSpell" || "attack" in c) return false;
          if (state.opponentMana < c.manaCost) return false;

          // 👇 NOVA REGRA DE INTELIGÊNCIA: Se for Equipamento, checa se a mesa tem alvos!
          if (c.cardType === "EquipSpell") {
            const allMonsters = [
              ...state.monsterZone,
              ...state.opponentMonsterZone,
            ].filter((m) => m !== null);
            const hasValidTarget = allMonsters.some((m) =>
              isValidEquipTarget(c, m),
            );
            if (!hasValidTarget) return false; // Se não tiver quem equipar, ele desiste de jogar!
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

        // 👇 ATUALIZADO: Filtra apenas monstros que o Bot tem mana para pagar
        if (!state.hasSummonedThisTurn) {
          const playableMonsters = state.opponentHand
            .filter((c: Card) => {
              if (!("attack" in c)) return false;
              if (state.opponentMana < c.manaCost) return false;

              const level = "level" in c ? c.level : 0;
              const tributesNeeded = level >= 7 ? 2 : level >= 5 ? 1 : 0;
              const activeMonstersCount = state.opponentMonsterZone.filter(
                (m: any) => m !== null,
              ).length;

              if (tributesNeeded === 0 && activeMonstersCount >= 4)
                return false; // Campo cheio!
              if (tributesNeeded > 0 && activeMonstersCount < tributesNeeded)
                return false; // Sem tributos!
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
          const myAtk = (attacker.card as any).attack;
          const validTargets = state.monsterZone
            .map((card: Card | null, index: number) => ({ card, index }))
            .filter((m: any) => m.card !== null);

          if (validTargets.length === 0) {
            uiCallbacks.handleOpponentDirectAttack(attacker.index);
            return;
          } else {
            validTargets.sort((a: any, b: any) => {
              const aStat =
                a.card!.cardPosition === "attack"
                  ? (a.card! as any).attack
                  : (a.card! as any).defense;
              const bStat =
                b.card!.cardPosition === "attack"
                  ? (b.card! as any).attack
                  : (b.card! as any).defense;
              return aStat - bStat;
            });
            if (
              myAtk >=
              (validTargets[0].card!.cardPosition === "attack"
                ? (validTargets[0].card! as any).attack
                : (validTargets[0].card! as any).defense)
            ) {
              uiCallbacks.handleOpponentAttack(
                attacker.index,
                validTargets[0].index,
              );
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
    state.currentPlayer,
    state.currentPhase,
    state.hasSummonedThisTurn,
    state.attackedMonsters,
    uiState,
    state.opponentHand,
    state.opponentMonsterZone,
    state.monsterZone,
    state.opponentMana,
    actions,
    uiCallbacks,
  ]);
}
