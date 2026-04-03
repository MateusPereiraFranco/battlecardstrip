// src/hooks/useOpponentBot.ts
import { useEffect } from "react";
import { Card } from "../types/card";
import { checkMonsterActivatedEffect } from "../utils/rules";

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
    handleOpponentSummon: (card: Card) => void; // 👇 NOVO: O Bot agora tem uma função oficial de invocar
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

    // Se houver qualquer janela ou animação, o Bot PAUSA.
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

    const thinkTimer = setTimeout(() => {
      // 1. COMPRA
      if (state.currentPhase === "draw") {
        actions.drawOpponentCard();
        return;
      }

      // 2. MAIN PHASE
      if (state.currentPhase === "main") {
        // bloco 0

        // 👇 NOVO: B. Ativar Magia de Campo
        const fieldSpells = state.opponentHand.filter(
          (c: Card) => c.cardType === "FieldSpell",
        );

        // SÓ ATIVA se ele tiver um campo na mão E a zona de campo dele estiver vazia!
        if (fieldSpells.length > 0 && !state.opponentFieldSpell) {
          const fieldToPlay = fieldSpells[0];

          // Tira da mão e coloca na Zona de Campo
          const newHand = state.opponentHand.filter(
            (c: Card) => c.id !== fieldToPlay.id,
          );
          actions.setOpponentHand(newHand);
          actions.setOpponentFieldSpell({
            ...fieldToPlay,
            isFaceDown: false,
            cardPosition: "attack",
            turnSet: state.currentTurn,
          });

          return; // Pausa a IA para você ver o campo batendo na mesa!
        }

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
            // 👇 CORRIGIDO: O Bot agora chama a função da UI para invocar e verificar SUAS armadilhas!
            uiCallbacks.handleOpponentSummon(mToPlay);
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

        // C. Ativar Efeitos de Monstros (Ex: Cavador)
        const unusedEffectMonsters = state.opponentMonsterZone.filter(
          (m: Card | null) =>
            m !== null &&
            !m.isFaceDown &&
            !state.usedEffectsThisTurn.includes(m.id),
        );

        for (const m of unusedEffectMonsters) {
          const effect = checkMonsterActivatedEffect(
            m,
            state.opponentHand.length,
          );
          if (effect.canActivate && effect.actionType === "DISCARD_TO_SEARCH") {
            actions.setUsedEffectsThisTurn((prev: string[]) => [...prev, m.id]);
            const cardToDiscard = state.opponentHand[0];
            const newHand = state.opponentHand.slice(1);
            actions.setOpponentGraveyard((prev: Card[]) => [
              ...prev,
              { ...cardToDiscard, isFaceDown: false },
            ]);
            const validCards = state.opponentDeck.filter(effect.filter!);
            if (validCards.length > 0) {
              const cardToAdd = validCards[0];
              newHand.push(cardToAdd);
              actions.setOpponentDeck((prev: Card[]) =>
                prev
                  .filter((c) => c.id !== cardToAdd.id)
                  .sort(() => Math.random() - 0.5),
              );
            }
            actions.setOpponentHand(newHand);
            return;
          }
        }

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

            const weakestTarget = validTargets[0];
            const targetStat =
              weakestTarget.card!.cardPosition === "attack"
                ? (weakestTarget.card! as any).attack
                : (weakestTarget.card! as any).defense;

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
        actions.nextPhase(() => uiCallbacks.clearUIAttacks());
        return;
      }

      // 4. END PHASE
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
