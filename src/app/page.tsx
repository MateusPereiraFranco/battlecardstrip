// src/app/page.tsx
"use client";

import { useState } from "react";
import CardView from "../components/CardView";
import CardDetail from "../components/CardDetail";
import { cardDatabase } from "../data/cards";
import { Card } from "../types/card";

const generateMockDeck = (): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < 5; i++) {
    cardDatabase.forEach((card) => {
      deck.push({ ...card, id: `${card.id}-clone-${i}` });
    });
  }
  return deck.sort(() => Math.random() - 0.5);
};

const faceDownDummyCard: Card = {
  id: "dummy",
  name: "Oponente",
  description: "",
  image: "",
  cardType: "NormalMonster",
  level: 1,
  attack: 0,
  defense: 0,
  attribute: "Trevas",
  race: "Guerreiro",
  isFaceDown: true,
};

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // NOSSOS ESTADOS DE MENU (Estão de volta!)
  const [activeHandCardId, setActiveHandCardId] = useState<string | null>(null);
  const [activeFieldCardId, setActiveFieldCardId] = useState<string | null>(
    null,
  );
  const [showGraveyardModal, setShowGraveyardModal] = useState(false);

  // LP
  const [playerLP, setPlayerLP] = useState(8000);
  const [opponentLP, setOpponentLP] = useState(8000);

  // === JOGADOR 1 ===
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

  // === OPONENTE ===
  const dragaoTeste = cardDatabase.find((c) => c.id === "m-001");
  const zumbiTeste = cardDatabase.find((c) => c.id === "m-003");

  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>(generateMockDeck());
  const [opponentMonsterZone, setOpponentMonsterZone] = useState<
    (Card | null)[]
  >([
    dragaoTeste
      ? {
          ...dragaoTeste,
          id: "opp-m1",
          isFaceDown: false,
          cardPosition: "attack",
        }
      : null,
    zumbiTeste
      ? {
          ...zumbiTeste,
          id: "opp-m2",
          isFaceDown: false,
          cardPosition: "defense",
        }
      : null,
    zumbiTeste
      ? {
          ...zumbiTeste,
          id: "opp-m2",
          isFaceDown: false,
          cardPosition: "attack",
        }
      : null,
  ]);
  const [opponentSpellZone, setOpponentSpellZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
  ]);
  const [opponentFieldSpell, setOpponentFieldSpell] = useState<Card | null>(
    null,
  );
  const [opponentGraveyard, setOpponentGraveyard] = useState<Card[]>([]);
  const [opponentBanished, setOpponentBanished] = useState<Card[]>([]);

  const drawCard = () => {
    if (deck.length === 0) return alert("Seu baralho acabou!");
    setHand([...hand, deck[0]]);
    setDeck(deck.slice(1));
  };

  const drawOpponentCard = () => {
    if (opponentDeck.length === 0)
      return alert("O baralho do oponente acabou!");
    setOpponentHand([...opponentHand, opponentDeck[0]]);
    setOpponentDeck(opponentDeck.slice(1));
  };

  const handlePlayCard = (cardToPlay: Card, isFaceDown: boolean = false) => {
    setActiveHandCardId(null);
    const finalIsFaceDown = cardToPlay.cardType === "Trap" ? true : isFaceDown;
    let position: "attack" | "defense" = "attack";
    if (finalIsFaceDown && "attack" in cardToPlay) position = "defense";
    const cardWithState = {
      ...cardToPlay,
      isFaceDown: finalIsFaceDown,
      cardPosition: position,
    };

    if (cardWithState.cardType === "FieldSpell") {
      setFieldSpell(cardWithState);
      setHand(hand.filter((c) => c.id !== cardToPlay.id));
    } else if (
      cardWithState.cardType === "Spell" ||
      cardWithState.cardType === "Trap"
    ) {
      const emptyIndex = spellZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        const newZone = [...spellZone];
        newZone[emptyIndex] = cardWithState;
        setSpellZone(newZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));
      } else alert("Zona de Mágicas/Armadilhas cheia!");
    } else {
      const emptyIndex = monsterZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        const newZone = [...monsterZone];
        newZone[emptyIndex] = cardWithState;
        setMonsterZone(newZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));
      } else alert("Zona de Monstros cheia!");
    }
  };

  const handleSendToGraveyard = (
    card: Card,
    zone: "monster" | "spell" | "field",
    index: number = 0,
  ) => {
    const resetCard = {
      ...card,
      isFaceDown: false,
      cardPosition: "attack" as const,
    };
    setGraveyard([...graveyard, resetCard]);
    if (zone === "monster") {
      const newZone = [...monsterZone];
      newZone[index] = null;
      setMonsterZone(newZone);
    } else if (zone === "spell") {
      const newZone = [...spellZone];
      newZone[index] = null;
      setSpellZone(newZone);
    } else if (zone === "field") {
      setFieldSpell(null);
    }
    setActiveFieldCardId(null);
    setSelectedCard(null);
  };

  // === SISTEMA DE COMBATE ===
  const [attackerInfo, setAttackerInfo] = useState<{
    card: Card;
    index: number;
  } | null>(null);

  const [attackingAnimId, setAttackingAnimId] = useState<string | null>(null);

  // 1. Atacar um Monstro
  const handleAttackMonster = (targetCard: Card, targetIndex: number) => {
    if (!attackerInfo) return;

    // Inicia a animação!
    setAttackingAnimId(attackerInfo.card.id);

    // Espera 500 milissegundos (o tempo do soco) antes de calcular quem morre
    setTimeout(() => {
      const myAtk =
        "attack" in attackerInfo.card ? attackerInfo.card.attack : 0;
      const oppAtk = "attack" in targetCard ? targetCard.attack : 0;
      const oppDef = "defense" in targetCard ? targetCard.defense : 0;

      if (targetCard.cardPosition === "attack") {
        if (myAtk > oppAtk) {
          setOpponentLP((prev) => prev - (myAtk - oppAtk));
          const newOppZone = [...opponentMonsterZone];
          newOppZone[targetIndex] = null;
          setOpponentMonsterZone(newOppZone);
          setOpponentGraveyard((prev) => [
            ...prev,
            { ...targetCard, isFaceDown: false },
          ]);
        } else if (myAtk < oppAtk) {
          setPlayerLP((prev) => prev - (oppAtk - myAtk));
          const newMyZone = [...monsterZone];
          newMyZone[attackerInfo.index] = null;
          setMonsterZone(newMyZone);
          setGraveyard((prev) => [
            ...prev,
            { ...attackerInfo.card, isFaceDown: false },
          ]);
        } else {
          const newOppZone = [...opponentMonsterZone];
          newOppZone[targetIndex] = null;
          setOpponentMonsterZone(newOppZone);
          setOpponentGraveyard((prev) => [
            ...prev,
            { ...targetCard, isFaceDown: false },
          ]);
          const newMyZone = [...monsterZone];
          newMyZone[attackerInfo.index] = null;
          setMonsterZone(newMyZone);
          setGraveyard((prev) => [
            ...prev,
            { ...attackerInfo.card, isFaceDown: false },
          ]);
        }
      } else {
        if (myAtk > oppDef) {
          const newOppZone = [...opponentMonsterZone];
          newOppZone[targetIndex] = null;
          setOpponentMonsterZone(newOppZone);
          setOpponentGraveyard((prev) => [
            ...prev,
            { ...targetCard, isFaceDown: false },
          ]);
        } else if (myAtk < oppDef) {
          setPlayerLP((prev) => prev - (oppDef - myAtk));
        }
      }

      setAttackingAnimId(null); // Termina animação
      setAttackerInfo(null); // Fim do ataque
    }, 500); // ⏱️ O "delay" da animação
  };

  // 2. Ataque Direto aos Pontos de Vida
  const handleDirectAttack = () => {
    if (!attackerInfo) return;

    const hasMonsters = opponentMonsterZone.some((slot) => slot !== null);
    if (hasMonsters) {
      alert(
        "Você não pode atacar diretamente se o oponente tem monstros no campo!",
      );
      setAttackerInfo(null);
      return;
    }

    setAttackingAnimId(attackerInfo.card.id);

    setTimeout(() => {
      const myAtk =
        "attack" in attackerInfo.card ? attackerInfo.card.attack : 0;
      setOpponentLP((prev) => prev - myAtk);

      setAttackingAnimId(null);
      setAttackerInfo(null);
    }, 500);
  };
  return (
    // h-screen e w-screen forçam a TELA ÚNICA sem rolagem (Master Duel style)
    <main
      onClick={() => {
        setActiveHandCardId(null);
        setActiveFieldCardId(null);
      }}
      className="h-screen w-screen flex bg-gray-950 overflow-hidden font-sans text-white"
    >
      {/* ========================================= */}
      {/* 1. PAINEL LATERAL ESQUERDO (Card Detail)  */}
      {/* ========================================= */}
      <div
        className="w-[360px] h-full bg-gray-900 border-r-4 border-gray-800 p-4 shrink-0 flex items-center z-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardDetail card={selectedCard} />
      </div>

      {/* ========================================= */}
      {/* 2. TABULEIRO PRINCIPAL (O Campo)          */}
      {/* ========================================= */}
      <div className="flex-1 h-full relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-gray-900 to-black">
        {/* === HUD OPONENTE (TOPO ESQUERDA) === */}
        {/* === HUD OPONENTE (TOPO ESQUERDA) === */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (attackerInfo) handleDirectAttack();
            }}
            className={`bg-red-950/80 border-2 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg transition-all ${
              attackerInfo && !opponentMonsterZone.some((c) => c !== null)
                ? "border-red-500 scale-110 cursor-crosshair pointer-events-auto animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                : "border-red-900 pointer-events-auto"
            }`}
          >
            <span className="text-red-400 font-bold uppercase tracking-widest text-sm">
              Oponente
            </span>
            <span className="text-3xl font-black text-red-500 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {opponentLP}
            </span>
          </div>
        </div>

        {/* Mão do Oponente (Topo Centro) */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-8 scale-[0.60] z-10">
          {opponentHand.length === 0 && (
            <span className="text-gray-500 italic mt-12 text-lg">
              Deck Oponente para simular
            </span>
          )}
          {opponentHand.map((_, i) => (
            <CardView
              key={`opp-hand-${i}`}
              card={faceDownDummyCard}
              disableDrag={true}
            />
          ))}
        </div>

        {/* === A GRADE DE BATALHA (PLAYMAT) === */}
        {/* Scale ajusta para caber na vertical, enquanto os gaps dão o espaço horizontal */}
        <div className="scale-[0.80] 2xl:scale-95 origin-center flex flex-col gap-3 rounded-xl p-4">
          {/* --- LINHA 1: OPONENTE (Deck, Magias, Extra Deck) --- */}
          {/* Aumentei para gap-8 para dar mais respiro horizontal */}
          <div className="flex gap-8 justify-center">
            <div
              onClick={drawOpponentCard}
              className="w-[100px] h-[145px] border-4 border-gray-600 rounded-sm bg-red-900 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer hover:border-gray-400"
            >
              <span className="text-red-300/50 font-bold text-[10px]">
                DECK ({opponentDeck.length})
              </span>
            </div>
            {/* Grupo de Mágicas do Oponente com gap-6 entre elas */}
            <div className="flex gap-6">
              {opponentSpellZone.map((c, i) => (
                <div
                  key={`o-s-${i}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-red-500/30 bg-red-500/5 rounded-sm flex items-center justify-center"
                >
                  {!c && (
                    <span className="text-red-500/30 text-[10px] font-bold">
                      MÁGICA
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-sm flex items-center justify-center">
              <span className="text-purple-500/30 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>
          </div>

          {/* --- LINHA 2: OPONENTE (Cemitério, Monstros, Campo) --- */}
          <div className="flex gap-8 justify-center">
            <div className="flex flex-col gap-2 w-[100px] items-center">
              <span className="text-red-500/80 text-[10px] font-bold text-center">
                BANIDAS: {opponentBanished.length}
              </span>
              <div className="w-[100px] h-[145px] border-2 border-solid border-gray-700 bg-gray-800 rounded-sm flex flex-col items-center justify-center shadow-inner">
                <span className="text-gray-500 text-[10px] font-bold">
                  CEMITÉRIO ({opponentGraveyard.length})
                </span>
              </div>
            </div>
            {/* Grupo de Monstros do Oponente */}
            <div className="flex justify-center gap-4">
              {opponentMonsterZone.map((cardInZone, index) => (
                <div
                  key={`opp-monster-${index}`}
                  // 👇 Se tem um atacante e tem uma carta aqui, vira um alvo! (cursor-crosshair)
                  className={`w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative ${
                    attackerInfo && cardInZone
                      ? "border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Se clicarmos aqui e tivermos um atacante selecionado, a porrada come!
                    if (attackerInfo && cardInZone) {
                      handleAttackMonster(cardInZone, index);
                    }
                  }}
                >
                  {!cardInZone ? (
                    <span className="text-red-500/30 text-[10px] font-bold">
                      MONSTRO
                    </span>
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <CardView card={cardInZone} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="w-[100px] h-[145px] mt-6 border-2 border-dashed border-red-400/30 bg-red-500/5 rounded-sm flex flex-col items-center justify-center relative">
              <span className="text-red-500/40 text-[10px] font-bold text-center">
                MAGIA DE
                <br />
                CAMPO
              </span>
            </div>
          </div>

          {/* DIVISÓRIA CENTRAL DA MESA */}
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent my-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

          {/* --- LINHA 3: JOGADOR 1 (Campo, Monstros, Cemitério) --- */}
          <div className="flex gap-8 justify-center">
            {/* Zona de Campo */}
            <div className="w-[100px] h-[145px] mt-6 border-2 border-dashed border-emerald-400/50 bg-emerald-500/10 rounded-sm flex flex-col items-center justify-center relative">
              {!fieldSpell && (
                <span className="text-emerald-500/50 text-[10px] font-bold text-center">
                  CAMPO
                </span>
              )}
              {fieldSpell && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* MENU DO CAMPO VOLTOU AQUI! */}
                  {activeFieldCardId === fieldSpell.id && (
                    <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                      <button
                        onClick={() =>
                          handleSendToGraveyard(fieldSpell, "field")
                        }
                        className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                      >
                        Cemitério
                      </button>
                    </div>
                  )}
                  <CardView
                    card={fieldSpell}
                    onClick={(c) => {
                      setSelectedCard(c);
                      setActiveFieldCardId(c.id);
                      setActiveHandCardId(null);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Zonas de Monstro (com gap-6 horizontal) */}
            <div className="flex gap-6">
              {monsterZone.map((cardInZone, index) => (
                <div
                  key={`p-m-${index}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-blue-500/40 bg-blue-500/10 rounded-sm flex items-center justify-center relative"
                >
                  {!cardInZone ? (
                    <span className="text-blue-500/50 text-[10px] font-bold">
                      MONSTRO
                    </span>
                  ) : (
                    <div
                      className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Borda brilhante se o monstro estiver atacando */}
                      {attackerInfo?.card.id === cardInZone.id && (
                        <div className="absolute inset-0 border-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                      )}

                      {/* MENU DO MONSTRO VOLTOU AQUI! */}
                      {activeFieldCardId === cardInZone.id && (
                        <div className="absolute -top-[50px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                          {/* 👇 NOVO BOTÃO DE ATACAR */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttackerInfo({ card: cardInZone, index }); // Engatilha o ataque!
                              setActiveFieldCardId(null);
                            }}
                            className="bg-orange-600 hover:bg-orange-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                          >
                            Atacar
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendToGraveyard(
                                cardInZone,
                                "monster",
                                index,
                              );
                            }}
                            className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                          >
                            Cemitério
                          </button>
                        </div>
                      )}

                      <div className="z-10">
                        <CardView
                          card={cardInZone}
                          fieldSpell={fieldSpell}
                          isAttacking={attackingAnimId === cardInZone.id}
                          onClick={(c) => {
                            setSelectedCard(c);
                            setActiveFieldCardId(c.id);
                            setActiveHandCardId(null);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cemitério e Banidas */}
            <div className="flex flex-col gap-2 w-[100px] items-center">
              <span className="text-gray-400 text-[10px] font-bold text-center">
                BANIDAS: {banished.length}
              </span>
              <div
                onClick={() =>
                  graveyard.length > 0 && setShowGraveyardModal(true)
                }
                className="relative w-[100px] h-[145px] border-2 border-solid border-gray-600 bg-gray-800 rounded-sm flex flex-col items-center justify-center shadow-inner cursor-pointer hover:border-gray-400"
              >
                {graveyard.length === 0 ? (
                  <span className="text-gray-400 text-[10px] font-bold">
                    CEMITÉRIO (0)
                  </span>
                ) : (
                  <div className="absolute inset-0 z-10">
                    <CardView
                      card={graveyard[graveyard.length - 1]}
                      disableDrag={true}
                      onClick={setSelectedCard}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-black text-white text-[12px] font-bold px-2 py-1 rounded-full border-2 border-gray-500 z-50">
                      {graveyard.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- LINHA 4: JOGADOR 1 (Extra Deck, Magias, Deck) --- */}
          <div className="flex gap-8 justify-center">
            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/50 bg-purple-500/10 rounded-sm flex items-center justify-center">
              <span className="text-purple-500/50 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>

            {/* Zonas de Magia (com gap-6) */}
            <div className="flex gap-6">
              {spellZone.map((cardInZone, index) => (
                <div
                  key={`p-s-${index}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-sm flex items-center justify-center relative"
                >
                  {!cardInZone ? (
                    <span className="text-emerald-500/50 text-[10px] font-bold">
                      MÁGICA
                    </span>
                  ) : (
                    <div
                      className="absolute inset-0 z-10 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* MENU DE MÁGICA VOLTOU AQUI! */}
                      {activeFieldCardId === cardInZone.id && (
                        <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                          <button
                            onClick={() =>
                              handleSendToGraveyard(cardInZone, "spell", index)
                            }
                            className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                          >
                            Cemitério
                          </button>
                        </div>
                      )}
                      <CardView
                        card={cardInZone}
                        onClick={(c) => {
                          setSelectedCard(c);
                          setActiveFieldCardId(c.id);
                          setActiveHandCardId(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Deck */}
            <div
              onClick={drawCard}
              className="relative w-[100px] h-[145px] border-4 border-white rounded-sm bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-[70px] h-[110px] border-[2px] border-amber-600 rounded-sm bg-amber-800 flex items-center justify-center shadow-inner">
                <div className="w-[40px] h-[40px] rounded-full bg-amber-500/50 flex items-center justify-center border-2 border-amber-400">
                  <span className="text-amber-200 font-bold text-[10px] transform -rotate-45 font-serif">
                    DECK
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-black text-white text-[12px] font-bold px-2 py-1 rounded-full border-2 border-gray-500 z-50">
                {deck.length}
              </div>
            </div>
          </div>
        </div>

        {/* === HUD JOGADOR 1 (BASE ESQUERDA) === */}
        <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
          <div className="bg-blue-950/80 border-2 border-blue-900 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg pointer-events-auto">
            <span className="text-blue-400 font-bold uppercase tracking-widest text-sm">
              Jogador 1
            </span>
            <span className="text-3xl font-black text-blue-500 font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
              {playerLP}
            </span>
          </div>
        </div>

        {/* === MÃO DO JOGADOR (RODAPÉ) === */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-4 z-40 p-4">
          {hand.length === 0 && (
            <span className="text-gray-400 italic bg-gray-900/50 px-4 py-2 rounded-full">
              Sua mão está vazia. Clique no Deck para comprar.
            </span>
          )}
          {hand.map((card) => (
            <div
              key={card.id}
              className="relative z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MENU DE INVOCAR/BAIXAR DA MÃO (VOLTOU AQUI!) */}
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
                  setActiveFieldCardId(null);
                }}
                onPlayCard={(c) => handlePlayCard(c, false)}
              />
            </div>
          ))}
        </div>

        {/* === GAVETA DO CEMITÉRIO === */}
        {showGraveyardModal && (
          <div
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col p-8 border-l-4 border-gray-700"
            onClick={() => setShowGraveyardModal(false)}
          >
            <div className="w-full flex justify-between items-center mb-6 border-b-2 border-gray-600 pb-4">
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
                Cemitério ({graveyard.length})
              </h2>
              <button className="text-white font-bold text-3xl bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center transition">
                &times;
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto flex flex-wrap gap-4 content-start"
              onClick={(e) => e.stopPropagation()}
            >
              {[...graveyard].reverse().map((c, i) => (
                <CardView
                  key={`gy-modal-${c.id}-${i}`}
                  card={c}
                  disableDrag={true}
                  onClick={setSelectedCard}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
