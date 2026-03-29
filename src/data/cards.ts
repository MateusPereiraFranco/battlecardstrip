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
  {
    id: "s-002",
    name: "Canhão de Trincheira Amaldiçoado",
    description:
      "Equipe apenas a um monstro que seja um 'Soldado'. O monstro equipado ganha 400 de ATK. Se o monstro equipado sair do campo, destrua esta carta.",
    image: "/images/canhao-trincheira.jpg", // Coloque o caminho da imagem que você gerar
    cardType: "EquipSpell",
    isFaceDown: false,
  },
  {
    id: "t-001",
    name: "Mina Terrestre Amaldiçoada",
    description:
      "Se o Campo de Trincheira estiver ativo no campo, quando o oponente invocar um monstro: destrua o monstro e esta carta.",
    image: "/images/mina-terrestre.jpg", // Coloque o caminho da imagem que você gerar
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
    isFaceDown: false,
  },
  {
    id: "m-003",
    name: "Soldado Zumbi",
    description:
      "Um soldado que pereceu nas trincheiras de uma grande guerra. Reanimado por magia negra, ele marcha incansavelmente.",
    image: "/images/soldado-zumbi.jpg",
    cardType: "NormalMonster",
    level: 4,
    attack: 1600,
    defense: 1200,
    attribute: "Trevas",
    race: "Soldado",
  },
];
