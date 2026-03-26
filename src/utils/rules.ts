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
