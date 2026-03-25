// src/data/cards.ts
import { Card } from "../types/card";

export const cardDatabase: Card[] = [
  {
    id: "m-001",
    name: "Dragão Negro de Olhos Amarelos",
    description:
      "Um dragão feroz que rasga os céus noturnos. Seus olhos amarelos paralisam as presas antes do ataque final.",
    image: "/images/dragao-negro-olho-amarelo.jpg", // Atualizado!
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
    image: "/images/mago-verde-espada.jpg", // Atualizado!
    cardType: "NormalMonster",
    level: 7,
    attack: 2500,
    defense: 2100,
    attribute: "Terra", // Mudei para Terra para combinar com o verde!
    race: "Mago",
  },
  {
    id: "s-001",
    name: "Buraco Negro Dimensional",
    description:
      "Cria uma fenda no espaço-tempo, destruindo todos os monstros no campo imediatamente.",
    image: "/images/buraco-negro.jpg", // Atualizado!
    cardType: "Spell",
  },
  {
    id: "f-001",
    name: "Campo de Trincheira",
    description:
      "Um campo de guerra fortificado. Todos os monstros do tipo [Soldado] ganham 200 de ATK e DEF.",
    image: "/images/campo-de-trincheira.jpg",
    cardType: "FieldSpell", // Usamos o tipo novo!
  },
];
