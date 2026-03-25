// src/types/card.ts

// 1. Definimos os Elementos (Atributos) genéricos para evitar copyright
export type CardAttribute =
  | "Fogo"
  | "Água"
  | "Terra"
  | "Vento"
  | "Luz"
  | "Trevas"
  | "Divino";

// 2. Definimos as "Raças" dos monstros (Tipos)
export type MonsterRace =
  | "Dragão"
  | "Guerreiro"
  | "Mago"
  | "Besta"
  | "Demônio"
  | "Máquina"
  | "Soldado";

// 3. A Base da Carta: Tudo que TODA carta tem, seja monstro ou mágica.
export interface BaseCard {
  id: string; // Um identificador único, ex: "card-001"
  name: string;
  description: string;
  image: string; // O caminho da imagem da carta
  isFaceDown?: boolean;
  cardPosition?: "attack" | "defense";
}

// 4. O Contrato para Cartas de Monstro
export interface MonsterCard extends BaseCard {
  cardType: "NormalMonster" | "EffectMonster" | "FusionMonster";
  level: number; // Estrelas do monstro (1 a 12)
  attack: number;
  defense: number;
  attribute: CardAttribute;
  race: MonsterRace;
}

// 5. O Contrato para Cartas Mágicas e Armadilhas
export interface SpellTrapCard extends BaseCard {
  cardType: "Spell" | "Trap" | "FieldSpell";
  // No futuro podemos adicionar "icon" (Equipamento, Contínua, etc.)
}

// 6. O Tipo Principal: Uma carta no jogo pode ser ou Monstro ou Mágica/Armadilha
export type Card = MonsterCard | SpellTrapCard;
