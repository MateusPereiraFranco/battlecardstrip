// src/app/page.tsx
"use client";

import { useState } from "react";
import CardView from "../components/CardView";
import CardDetail from "../components/CardDetail";
import { cardDatabase } from "../data/cards";
import { Card } from "../types/card";

// --- GERADOR DE BARALHO FALSO PARA TESTES ---
// Multiplicamos as cartas do database para ter o que comprar!
const generateMockDeck = (): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < 5; i++) {
    cardDatabase.forEach((card) => {
      // Cria uma cópia da carta com um ID único
      deck.push({ ...card, id: `${card.id}-clone-${i}` });
    });
  }
  // Embaralha o deck simples
  return deck.sort(() => Math.random() - 0.5);
};

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeHandCardId, setActiveHandCardId] = useState<string | null>(null);

  // === MEMÓRIAS DO TABULEIRO ===
  // A mão começa vazia (ou com 4 cartas se você quiser no futuro)
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>(generateMockDeck());

  const [monsterZone, setMonsterZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
  ]);
  const [spellZone, setSpellZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
  ]);
  const [fieldSpell, setFieldSpell] = useState<Card | null>(null);

  const [graveyard, setGraveyard] = useState<Card[]>([]);
  const [banished, setBanished] = useState<Card[]>([]);

  // === LÓGICA DE COMPRAR CARTA (DRAW) ===
  const drawCard = () => {
    if (deck.length === 0) {
      alert("Seu baralho acabou!");
      return;
    }
    // Pega a primeira carta do baralho (índice 0)
    const drawnCard = deck[0];

    // Atualiza a mão adicionando a nova carta
    setHand([...hand, drawnCard]);

    // Atualiza o baralho removendo a primeira carta
    setDeck(deck.slice(1));
  };

  // === LÓGICA DE JOGAR CARTA ===
  const handlePlayCard = (cardToPlay: Card, isFaceDown: boolean = false) => {
    setActiveHandCardId(null);
    const finalIsFaceDown = cardToPlay.cardType === "Trap" ? true : isFaceDown;

    let position: "attack" | "defense" = "attack";
    if (finalIsFaceDown && "attack" in cardToPlay) {
      position = "defense";
    }

    const cardWithState = {
      ...cardToPlay,
      isFaceDown: finalIsFaceDown,
      cardPosition: position,
    };

    // === REGRA NOVA: MAGIA DE CAMPO ===
    if (cardWithState.cardType === "FieldSpell") {
      // Vai direto para o estado isolado de "fieldSpell" (na coluna esquerda!)
      setFieldSpell(cardWithState);
      setHand(hand.filter((c) => c.id !== cardToPlay.id));
    }
    // === MÁGICAS NORMAIS E ARMADILHAS ===
    else if (
      cardWithState.cardType === "Spell" ||
      cardWithState.cardType === "Trap"
    ) {
      const emptyIndex = spellZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        const newSpellZone = [...spellZone];
        newSpellZone[emptyIndex] = cardWithState;
        setSpellZone(newSpellZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));
      } else {
        alert("Zona de Mágicas/Armadilhas está cheia!");
      }
    }
    // === MONSTROS ===
    else {
      const emptyIndex = monsterZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        const newMonsterZone = [...monsterZone];
        newMonsterZone[emptyIndex] = cardWithState;
        setMonsterZone(newMonsterZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));
      } else {
        alert("Zona de Monstros está cheia!");
      }
    }
  };

  return (
    <main
      onClick={() => setActiveHandCardId(null)}
      className="min-h-screen bg-gray-900 flex p-8 gap-8 items-start justify-center overflow-hidden"
    >
      {/* PAINEL DE INSPEÇÃO */}
      <div className="sticky top-8" onClick={(e) => e.stopPropagation()}>
        <CardDetail card={selectedCard} />
      </div>

      <div
        className="flex-1 max-w-5xl flex flex-col gap-6 mt-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* === MESA COMPLETA (3 COLUNAS) === */}
        <div className="flex gap-4 bg-gray-800/50 p-6 rounded-2xl border-2 border-gray-700 justify-between">
          {/* COLUNA ESQUERDA: Magia de Campo e Extra Deck */}
          <div className="flex flex-col justify-between gap-4">
            <div className="w-[100px] h-[145px] border-2 border-dashed border-emerald-400/50 rounded-sm bg-emerald-500/10 flex flex-col items-center justify-center relative">
              <span className="text-emerald-500/50 text-[10px] font-bold text-center">
                MAGIA DE
                <br />
                CAMPO
              </span>
              {fieldSpell && (
                <div className="absolute top-0 left-0 z-10">
                  <CardView card={fieldSpell} onClick={setSelectedCard} />
                </div>
              )}
            </div>

            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/50 rounded-sm bg-purple-500/10 flex items-center justify-center relative">
              <span className="text-purple-500/50 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>
          </div>

          {/* COLUNA CENTRAL: Monstros e Mágicas */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              {monsterZone.map((cardInZone, index) => (
                <div
                  key={`monster-${index}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-orange-500/50 rounded-sm bg-orange-500/10 flex items-center justify-center relative"
                >
                  {!cardInZone ? (
                    <span className="text-orange-500/50 text-[10px] font-bold">
                      MONSTRO
                    </span>
                  ) : (
                    <div className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full">
                      <CardView card={cardInZone} onClick={setSelectedCard} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              {spellZone.map((cardInZone, index) => (
                <div
                  key={`spell-${index}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-emerald-500/50 rounded-sm bg-emerald-500/10 flex items-center justify-center relative"
                >
                  {!cardInZone ? (
                    <span className="text-emerald-500/50 text-[10px] font-bold">
                      MÁGICA
                    </span>
                  ) : (
                    <div className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full">
                      <CardView card={cardInZone} onClick={setSelectedCard} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA: Banidas, Cemitério e Deck */}
          <div className="flex flex-col justify-between gap-4">
            {/* Zona de Banidas */}
            <div className="w-[100px] h-[145px] border-2 border-dashed border-gray-500/50 rounded-sm bg-gray-500/10 flex flex-col items-center justify-center">
              <span className="text-gray-500/50 text-[10px] font-bold">
                BANIDAS
              </span>
              <span className="text-white text-xs mt-1">{banished.length}</span>
            </div>

            {/* Cemitério */}
            <div className="w-[100px] h-[145px] border-2 border-solid border-gray-600 rounded-sm bg-gray-800 flex flex-col items-center justify-center shadow-inner">
              <span className="text-gray-400 text-[10px] font-bold">
                CEMITÉRIO
              </span>
              <span className="text-white text-xs mt-1">
                {graveyard.length}
              </span>
            </div>

            {/* O Baralho (Deck) */}
            <div
              onClick={drawCard}
              className="w-[100px] h-[145px] border-4 border-white rounded-sm bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-[70px] h-[110px] border-[2px] border-amber-600 rounded-sm bg-amber-800 flex items-center justify-center shadow-inner">
                <div className="w-[40px] h-[40px] rounded-full bg-amber-500/50 flex items-center justify-center border-2 border-amber-400">
                  <span className="text-amber-200 font-bold text-[10px] transform -rotate-45 font-serif">
                    DECK
                  </span>
                </div>
              </div>
              {/* Contador de cartas restantes */}
              <div className="absolute -bottom-3 right-0 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full border border-gray-500">
                {deck.length}
              </div>
            </div>
          </div>
        </div>

        {/* === MÃO DO JOGADOR === */}
        <div className="relative border-t-2 border-blue-900/50 pt-6">
          <h2 className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-4 text-blue-400 font-bold">
            Sua Mão
          </h2>

          <div className="flex justify-center gap-4 p-4 min-h-[160px] items-end flex-wrap">
            {hand.length === 0 && (
              <span className="text-gray-500 italic mb-10">
                Sua mão está vazia. Clique no Deck para comprar!
              </span>
            )}

            {hand.map((card) => (
              <div key={card.id} className="relative">
                {activeHandCardId === card.id && (
                  <div className="absolute -top-[70px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                    {"attack" in card && (
                      <>
                        <button
                          onClick={() => handlePlayCard(card, false)}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                        >
                          <div className="w-3 h-5 border border-white bg-blue-400"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Invocar
                          </span>
                        </button>
                        <button
                          onClick={() => handlePlayCard(card, true)}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                        >
                          <div className="w-5 h-3 border border-white bg-amber-800"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Baixar
                          </span>
                        </button>
                      </>
                    )}
                    {(card.cardType === "Spell" ||
                      card.cardType === "FieldSpell") && (
                      <>
                        <button
                          onClick={() => handlePlayCard(card, false)}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                        >
                          <div className="w-3 h-5 border border-white bg-emerald-500"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Ativar
                          </span>
                        </button>
                        <button
                          onClick={() => handlePlayCard(card, true)}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                        >
                          <div className="w-3 h-5 border border-white bg-amber-800"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Baixar
                          </span>
                        </button>
                      </>
                    )}
                    {card.cardType === "Trap" && (
                      <button
                        onClick={() => handlePlayCard(card, true)}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                      >
                        <div className="w-3 h-5 border border-white bg-amber-800"></div>
                        <span className="text-[10px] text-white mt-1 font-bold">
                          Baixar
                        </span>
                      </button>
                    )}
                  </div>
                )}
                <CardView
                  card={card}
                  onClick={(c) => {
                    setSelectedCard(c);
                    setActiveHandCardId(c.id);
                  }}
                  onPlayCard={(c) => handlePlayCard(c, false)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
