// src/data/cards.ts
import { Card } from "../types/card";

export const cardDatabase: Card[] = [
  {
    id: "m-001",
    name: "Dragão Negro de Olhos Amarelos",
    description:
      "Um dragão feroz que rasga os céus noturnos. Seus olhos amarelos paralisam as presas antes do ataque final.",
    image: "/images/dragao-negro-olho-amarelo.jpg",
    manaCost: 2,
    cardType: "NormalMonster",
    level: 8,
    attack: 3000,
    defense: 2500,
    attribute: "Trevas",
    race: "Dragão",
  },
  {
    id: "m-002",
    name: "Mago Verde Espadachim",
    description:
      "Um guerreiro místico que combina feitiços da natureza com cortes precisos de sua espada encantada.",
    image: "/images/mago-verde-espada.jpg",
    manaCost: 1,
    cardType: "NormalMonster",
    level: 7,
    attack: 2500,
    defense: 2100,
    attribute: "Terra",
    race: "Mago",
  },
  {
    id: "m-003",
    name: "Soldado Zumbi",
    description:
      "Um soldado que pereceu nas trincheiras de uma grande guerra. Reanimado por magia negra, ele marcha incansavelmente.",
    image: "/images/soldado-zumbi.jpg",
    manaCost: 1,
    cardType: "NormalMonster",
    level: 4,
    attack: 1600,
    defense: 1200,
    attribute: "Trevas",
    race: "Soldado",
  },
  {
    id: "m-004",
    name: "Batedor da Trincheira",
    description:
      "Se este monstro for invocado, busque no deck um monstro do tipo soldado, ou uma Mina Terrestre, ou um Kamikaze, ou um Canhão de Trincheira, ou um Campo trincheira.",
    image: "/images/batedor-trincheira.jpg",
    manaCost: 1,
    cardType: "EffectMonster",
    level: 3,
    attack: 1500,
    defense: 1200,
    attribute: "Trevas",
    race: "Soldado",
  },
  {
    id: "m-005",
    name: "Cavador da Trincheira",
    description:
      "Uma vez por turno, descarte uma carta e busque um monstro soldado ou um Campo trincheira.",
    image: "/images/cavador-trincheira.jpg",
    manaCost: 1,
    cardType: "EffectMonster",
    level: 3,
    attack: 1000,
    defense: 1200,
    attribute: "Trevas",
    race: "Soldado",
  },
  {
    id: "m-006",
    name: "Sentinela da Trincheira",
    description:
      "Se Campo Trincheira estiver ativo no campo, quando este mosntro virar, invoque por invocação especial um monstro soldado da mão ou do cemitério.",
    image: "/images/sentinela-trincheira.jpg",
    manaCost: 1,
    cardType: "EffectMonster",
    level: 3,
    attack: 1000,
    defense: 1200,
    attribute: "Trevas",
    race: "Soldado",
  },
  {
    id: "s-001",
    name: "Buraco Negro Dimensional",
    description:
      "Cria uma fenda no espaço-tempo, destruindo todos os monstros no campo imediatamente.",
    image: "/images/buraco-negro.jpg",
    manaCost: 2,
    cardType: "Spell",
  },
  {
    id: "s-002",
    name: "Canhão de Trincheira Amaldiçoado",
    description:
      "Equipe apenas a um monstro que seja um 'Soldado'. O monstro equipado ganha 400 de ATK. Se o monstro equipado sair do campo, destrua esta carta.",
    image: "/images/canhao-trincheira.jpg",
    manaCost: 1,
    cardType: "EquipSpell",
    isFaceDown: false,
  },
  {
    id: "f-001",
    name: "Campo de Trincheira",
    description:
      "Um campo de guerra fortificado. Todos os monstros do tipo [Soldado] ganham 200 de ATK e DEF.",
    image: "/images/campo-de-trincheira.jpg",
    manaCost: 1,
    cardType: "FieldSpell",
  },
  {
    id: "t-001",
    name: "Mina Terrestre Amaldiçoada",
    description:
      "Se o Campo de Trincheira estiver ativo no campo, quando o oponente invocar um monstro: destrua o monstro e esta carta.",
    image: "/images/mina-terrestre.jpg",
    manaCost: 1,
    cardType: "Trap",
    isFaceDown: false,
  },
  {
    id: "t-003",
    name: "Kamikaze",
    description:
      "Se o Campo de Trincheira estiver ativo em campo e você controlar um monstro do tipo Soldado: quando o oponente declarar um ataque, destrua 1 monstro do tipo Soldado que você controla e o monstro atacante do oponente.",
    cardType: "Trap",
    image: "/images/kamikaze.jpg",
    manaCost: 1,
    isFaceDown: false,
  },
];
