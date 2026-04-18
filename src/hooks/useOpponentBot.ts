// src/hooks/useOpponentBot.ts
import { useEffect } from "react";
import { Card } from "../types/card";
import { isValidEquipTarget, getEffectiveStats } from "../utils/rules";

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
    if (state.playerLP <= 0 || state.opponentLP <= 0) return;
    if (state.currentPlayer !== "opponent") return;
    if (
      uiState.pendingPrompt ||
      uiState.resolvingEffectId ||
      uiState.attackingAnimId
    )
      return;

    const thinkTimer = setTimeout(() => {
      // ==========================================
      // FASE DE COMPRA
      // ==========================================
      if (state.currentPhase === "draw") {
        actions.drawOpponentCard();
        return;
      }

      // ==========================================
      // FASE PRINCIPAL (MAIN PHASE) - O CÉREBRO
      // ==========================================
      if (state.currentPhase === "main") {
        // 1. LEITURA DA MESA (Heurística)
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

        // 2. PRIORIDADE 1: JOGAR CAMPO
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
            return; // Espera o próximo ciclo para pensar de novo
          }
        }

        // 3. PRIORIDADE 2: AVALIAR MÁGICAS E ARMADILHAS
        const playableSpells = state.opponentHand.filter((c: Card) => {
          if (c.cardType === "FieldSpell" || "attack" in c) return false;
          if (state.opponentMana < c.manaCost) return false;

          // REGRA DE OURO 1: Buraco Negro Dimensional (Wipe)
          if (c.name.includes("Buraco Negro")) {
            // Só joga se o humano tiver mais monstros OU se o humano tiver um monstro mais forte que os meus
            const imLosingBoard = enemyMonsters.length > myMonsters.length;
            const imOutpowered = enemyStrongestAtk > myStrongestAtk;
            if (!imLosingBoard && !imOutpowered) return false; // "Não vou explodir a mesa se estou ganhando!"
          }

          // REGRA DE OURO 2: Equipamentos
          if (c.cardType === "EquipSpell") {
            // Só joga se o Bot tiver monstros. Ele NUNCA equipa no inimigo por enquanto.
            const hasValidTarget = myMonsters.some((m: any) =>
              isValidEquipTarget(c, m),
            );
            if (!hasValidTarget) return false;
          }

          return true; // Se passou pelos testes, a carta é boa para ser jogada
        });

        // Joga a primeira mágica aprovada pela heurística
        if (
          playableSpells.length > 0 &&
          state.opponentSpellZone.some((s: any) => s === null)
        ) {
          uiCallbacks.handleOpponentPlaySpell(playableSpells[0]);
          return;
        }

        // 4. PRIORIDADE 3: AVALIAR E INVOCAR MONSTROS
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

              // Se for invocar com tributo, não faça isso se for sacrificar o monstro mais forte à toa
              if (tributesNeeded > 0 && c.attack <= myStrongestAtk)
                return false;

              return true;
            })
            // Ordena para invocar sempre o mais forte primeiro!
            .sort((a: any, b: any) => b.attack - a.attack);

          if (playableMonsters.length > 0) {
            uiCallbacks.handleOpponentSummon(playableMonsters[0]);
            return;
          }
        }

        // Se não tem mais nada de útil para fazer, passa para a Batalha
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

          // Calcula os status reais do atacante (com campos e equips)
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
            // Ataque Direto!
            uiCallbacks.handleOpponentDirectAttack(attacker.index);
            return;
          } else {
            // O Bot sempre foca no monstro mais fraco do oponente para limpar a mesa
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

            // Só ataca se tiver certeza que vai ganhar a troca (ou se for igual)
            if (myAtk >= targetScore) {
              uiCallbacks.handleOpponentAttack(attacker.index, target.index);
            } else {
              // Marca como "atacou" apenas para pular ele e evitar loop infinito
              actions.setAttackedMonsters((prev: string[]) => [
                ...prev,
                attacker.card!.id,
              ]);
            }
            return;
          }
        }
        // Se ninguém mais puder atacar, fim de turno
        actions.nextPhase(() => uiCallbacks.clearUIAttacks());
        return;
      }

      // Finaliza o turno do Bot
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
  ]);
}
