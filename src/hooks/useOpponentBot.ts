// src/hooks/useOpponentBot.ts
import { useEffect } from "react";
import { Card } from "../types/card";

interface OpponentBotProps {
  state: any;
  actions: any;
  uiState: {
    pendingPrompt: any;
    pendingSelection: any;
    pendingDeckSearch: any;
    pendingDiscard: any;
    pendingSpecialSummon: any;
    resolvingEffectId: string | null;
    attackingAnimId: string | null;
  };
  uiCallbacks: {
    handleOpponentDirectAttack: (attackerIndex: number) => void;
    handleOpponentAttack: (attackerIndex: number, targetIndex: number) => void;
    clearUIAttacks: () => void;
  };
}

export function useOpponentBot({
  state,
  actions,
  uiState,
  uiCallbacks,
}: OpponentBotProps) {
  useEffect(() => {
    // Só roda se for a vez do bot
    if (state.currentPlayer !== "opponent") return;

    // Se houver qualquer janela, animação, compra, ou se a tela estiver travada, o Bot PAUSA e espera o jogador.
    if (
      uiState.pendingPrompt ||
      uiState.pendingSelection ||
      uiState.pendingDeckSearch ||
      uiState.pendingDiscard ||
      uiState.pendingSpecialSummon ||
      uiState.resolvingEffectId ||
      uiState.attackingAnimId
    )
      return;

    // Timer de 1.5s para ele "pensar" antes de cada jogada
    const thinkTimer = setTimeout(() => {
      // 1. COMPRA
      if (state.currentPhase === "draw") {
        actions.drawOpponentCard();
        return;
      }

      // 2. MAIN PHASE
      if (state.currentPhase === "main") {
        // A. Invocar Monstro
        if (!state.hasSummonedThisTurn) {
          const playableMonsters = state.opponentHand
            .filter((c: Card) => "attack" in c)
            .sort((a: any, b: any) => b.attack - a.attack);
          const emptyMIdx = state.opponentMonsterZone.findIndex(
            (m: Card | null) => m === null,
          );

          if (playableMonsters.length > 0 && emptyMIdx !== -1) {
            const mToPlay = playableMonsters[0];
            const newHand = state.opponentHand.filter(
              (c: Card) => c.id !== mToPlay.id,
            );
            actions.setOpponentHand(newHand);
            actions.setOpponentMonsterZone((prev: (Card | null)[]) => {
              const nz = [...prev];
              nz[emptyMIdx] = {
                ...mToPlay,
                isFaceDown: false,
                cardPosition: "attack",
                turnSet: state.currentTurn,
              };
              return nz;
            });
            actions.setHasSummonedThisTurn(true);
            return;
          }
        }

        // B. Baixar Armadilhas
        const traps = state.opponentHand.filter(
          (c: Card) => c.cardType === "Trap",
        );
        const emptySIdx = state.opponentSpellZone.findIndex(
          (s: Card | null) => s === null,
        );
        if (traps.length > 0 && emptySIdx !== -1) {
          const trapToPlay = traps[0];
          const newHand = state.opponentHand.filter(
            (c: Card) => c.id !== trapToPlay.id,
          );
          actions.setOpponentHand(newHand);
          actions.setOpponentSpellZone((prev: (Card | null)[]) => {
            const nz = [...prev];
            nz[emptySIdx] = {
              ...trapToPlay,
              isFaceDown: true,
              cardPosition: "attack",
              turnSet: state.currentTurn,
            };
            return nz;
          });
          return;
        }

        // C. Passa pra batalha
        actions.nextPhase(() => uiCallbacks.clearUIAttacks());
        return;
      }

      // 3. BATTLE PHASE
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
            uiCallbacks.handleOpponentDirectAttack(attacker.index); // ATAQUE DIRETO!
            return;
          } else {
            // Busca o seu monstro mais fraco
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

            const weakestTarget = validTargets[0];
            const targetStat =
              weakestTarget.card!.cardPosition === "attack"
                ? (weakestTarget.card! as any).attack
                : (weakestTarget.card! as any).defense;

            // IA Inteligente: Só ataca se for matar ou empatar. Se ele for mais fraco, pula.
            if (myAtk >= targetStat) {
              uiCallbacks.handleOpponentAttack(
                attacker.index,
                weakestTarget.index,
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

        // Fim da batalha, passa o turno
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
    uiState.pendingPrompt,
    uiState.pendingSelection,
    uiState.pendingDeckSearch,
    uiState.pendingDiscard,
    uiState.pendingSpecialSummon,
    uiState.resolvingEffectId,
    uiState.attackingAnimId,
    state.opponentHand,
    state.opponentMonsterZone,
    state.opponentSpellZone,
    state.monsterZone,
    actions,
    uiCallbacks,
  ]);
}
