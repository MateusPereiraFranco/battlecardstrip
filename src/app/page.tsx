// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import CardView from "../components/CardView";
import CardDetail from "../components/CardDetail";
import { cardDatabase } from "../data/cards";
import { Card } from "../types/card";
import { isValidEquipTarget, getEquipBuff } from "../utils/rules"; // Nossas regras importadas!

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

  // === NOSSOS ESTADOS DE MENU ===
  const [activeHandCardId, setActiveHandCardId] = useState<string | null>(null);
  const [activeFieldCardId, setActiveFieldCardId] = useState<string | null>(
    null,
  );
  const [showGraveyardModal, setShowGraveyardModal] = useState(false);
  const [showOpponentGraveyardModal, setShowOpponentGraveyardModal] =
    useState(false);

  // === LP ===
  const [playerLP, setPlayerLP] = useState(8000);
  const [opponentLP, setOpponentLP] = useState(8000);

  // 👇 1. O RELÓGIO (SISTEMA DE TURNOS)
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [currentPlayer, setCurrentPlayer] = useState<"player" | "opponent">(
    "player",
  );
  const [currentPhase, setCurrentPhase] = useState<
    "draw" | "main" | "battle" | "end"
  >("main");

  // 👇 2. A FUNÇÃO QUE PASSA O TURNO
  const handleNextPhase = () => {
    if (currentPhase === "draw") {
      alert("Você é obrigado a comprar uma carta clicando no seu Deck!");
      return;
    }

    if (currentPhase === "main") {
      if (currentTurn === 1) {
        // Turno 1 pula direto pro final, não tem batalha!
        setCurrentPhase("end");
      } else {
        setCurrentPhase("battle");
      }
    } else if (currentPhase === "battle") {
      setCurrentPhase("end");
    } else if (currentPhase === "end") {
      // Passa o turno pro adversário e joga ele na Fase de Compra
      setCurrentPlayer((prev) => (prev === "player" ? "opponent" : "player"));
      setCurrentTurn((prev) => prev + 1);
      setCurrentPhase("draw");
    }
  };

  // === JOGADOR 1 ===

  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);

  //const [playerInitialDeck] = useState(() => generateMockDeck());

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
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);

  useEffect(() => {
    // Quando o jogo abre no navegador, ele embaralha e distribui as 4 cartas!
    const myInitialDeck = generateMockDeck();
    setHand(myInitialDeck.slice(0, 4));
    setDeck(myInitialDeck.slice(4));

    const oppInitialDeck = generateMockDeck();
    setOpponentHand(oppInitialDeck.slice(0, 4));
    setOpponentDeck(oppInitialDeck.slice(4));
  }, []);

  const [opponentMonsterZone, setOpponentMonsterZone] = useState<
    (Card | null)[]
  >([null, null, null]);

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

  const isEquipCard = (c: Card) => c.cardType === "EquipSpell";

  // === SISTEMA DE COMBATE ===
  const [attackerInfo, setAttackerInfo] = useState<{
    card: Card;
    index: number;
  } | null>(null);
  const [attackTrajectory, setAttackTrajectory] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [attackingAnimId, setAttackingAnimId] = useState<string | null>(null);

  // === SISTEMA DE MÁGICAS ===
  const [resolvingEffectId, setResolvingEffectId] = useState<string | null>(
    null,
  );

  // === SISTEMA DE EQUIPAMENTOS ===
  const [pendingEquip, setPendingEquip] = useState<{
    spellCard: Card;
    spellIndex: number;
  } | null>(null);
  const [equipLinks, setEquipLinks] = useState<
    { spellId: string; monsterId: string }[]
  >([]);

  const canActivateEquip = (equipCard: Card) => {
    const allMonsters = [...monsterZone, ...opponentMonsterZone].filter(
      (c) => c !== null,
    ) as Card[];
    return allMonsters.some((m) => isValidEquipTarget(equipCard, m));
  };

  // 👁️ O OLHO MÁGICO VIGIA O CAMPO
  useEffect(() => {
    const activeMonsterIds = [...monsterZone, ...opponentMonsterZone]
      .filter((c) => c !== null)
      .map((c) => c!.id);

    equipLinks.forEach((link) => {
      if (!activeMonsterIds.includes(link.monsterId)) {
        const spellIdx = spellZone.findIndex((s) => s?.id === link.spellId);
        if (spellIdx !== -1) {
          const deadSpell = spellZone[spellIdx]!;
          setSpellZone((prev) => {
            const nz = [...prev];
            nz[spellIdx] = null;
            return nz;
          });
          setGraveyard((prev) => [
            ...prev,
            { ...deadSpell, isFaceDown: false, cardPosition: "attack" },
          ]);
        }
        setEquipLinks((prev) => prev.filter((l) => l.spellId !== link.spellId));
      }
    });
  }, [monsterZone, opponentMonsterZone, equipLinks, spellZone]);

  // === AÇÕES DE CARTAS ===
  const drawCard = () => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "draw")
      return alert(
        "Você só pode comprar cartas durante a Fase de Compra (Draw Phase)!",
      );
    if (pendingEquip)
      return alert("Conclua o Equipamento antes de comprar cartas!");
    if (deck.length === 0) return alert("Seu baralho acabou!");

    setHand([...hand, deck[0]]);
    setDeck(deck.slice(1));
    setCurrentPhase("main"); // ⏭️ Avança de fase sozinho!
  };

  const drawOpponentCard = () => {
    if (currentPlayer !== "opponent")
      return alert("Não é o turno do oponente!");
    if (currentPhase !== "draw")
      return alert(
        "Você só pode comprar cartas durante a Fase de Compra (Draw Phase)!",
      );
    if (pendingEquip) return alert("Conclua o Equipamento primeiro!");
    if (opponentDeck.length === 0)
      return alert("O baralho do oponente acabou!");

    setOpponentHand([...opponentHand, opponentDeck[0]]);
    setOpponentDeck(opponentDeck.slice(1));
    setCurrentPhase("main"); // ⏭️ Avança de fase sozinho!
  };

  const handlePlayCard = (cardToPlay: Card, isFaceDown: boolean = false) => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "main")
      return alert(
        "Você só pode invocar/baixar cartas na Fase Principal (Main Phase)!",
      );
    setActiveHandCardId(null);
    const finalIsFaceDown = cardToPlay.cardType === "Trap" ? true : isFaceDown;
    let position: "attack" | "defense" = "attack";
    if (finalIsFaceDown && "attack" in cardToPlay) position = "defense";
    const cardWithState = {
      ...cardToPlay,
      isFaceDown: finalIsFaceDown,
      cardPosition: position,
      turnSet: currentTurn,
    };

    if (cardWithState.cardType === "FieldSpell") {
      setFieldSpell(cardWithState);
      setHand(hand.filter((c) => c.id !== cardToPlay.id));
    } else if (
      cardWithState.cardType === "Spell" ||
      cardWithState.cardType === "Trap" ||
      cardWithState.cardType === "EquipSpell"
    ) {
      const emptyIndex = spellZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        // 🛑 TRAVA DE EQUIPAMENTO DA MÃO
        if (!finalIsFaceDown && cardWithState.cardType === "EquipSpell") {
          if (!canActivateEquip(cardWithState)) {
            alert("Não há alvos válidos no campo para este equipamento!");
            return;
          }
        }

        const newZone = [...spellZone];
        newZone[emptyIndex] = cardWithState;
        setSpellZone(newZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));

        if (
          !finalIsFaceDown &&
          (cardWithState.cardType === "Spell" ||
            cardWithState.cardType === "EquipSpell")
        ) {
          handleActivateSpell(cardWithState, emptyIndex, newZone);
        }
      } else alert("Zona de Mágicas/Armadilhas está cheia!");
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

  const handleEquipToMonster = (
    targetCard: Card,
    targetIndex: number,
    isOpponent: boolean,
  ) => {
    if (!pendingEquip) return;
    if (!("attack" in targetCard)) return;

    if (!isValidEquipTarget(pendingEquip.spellCard, targetCard)) return;

    setEquipLinks((prev) => [
      ...prev,
      { spellId: pendingEquip.spellCard.id, monsterId: targetCard.id },
    ]);

    const buffs = getEquipBuff(pendingEquip.spellCard);
    const buffedCard = { ...targetCard, attack: targetCard.attack + buffs.atk };

    if (isOpponent) {
      setOpponentMonsterZone((prev) => {
        const nz = [...prev];
        nz[targetIndex] = buffedCard;
        return nz;
      });
    } else {
      setMonsterZone((prev) => {
        const nz = [...prev];
        nz[targetIndex] = buffedCard;
        return nz;
      });
    }
    setPendingEquip(null); // Concluiu o Equipamento!
  };

  const handleActivateSpell = (
    spellCard: Card,
    spellIndex: number,
    currentSpellZone?: (Card | null)[],
  ) => {
    if (resolvingEffectId || attackingAnimId) return;
    if (spellCard.cardType !== "Trap" && currentPlayer !== "player") {
      alert("Você só pode ativar Cartas Mágicas durante o seu próprio turno!");
      return;
    }
    setResolvingEffectId(spellCard.id);

    if (spellCard.isFaceDown) {
      const zoneToUpdate = currentSpellZone || spellZone;
      const newZone = [...zoneToUpdate];
      newZone[spellIndex] = { ...spellCard, isFaceDown: false };
      setSpellZone(newZone);
    }

    if (spellCard.cardType === "EquipSpell") {
      if (!canActivateEquip(spellCard)) {
        alert("Não há alvos válidos para equipar!");
        setResolvingEffectId(null);
        setActiveFieldCardId(null);
        return;
      }
      setPendingEquip({ spellCard, spellIndex }); // Entra no modo de mira!
      setResolvingEffectId(null);
      setActiveFieldCardId(null);
      return;
    }

    if (spellCard.cardType === "Trap") {
      setTimeout(() => {
        // A armadilha brilhou e assustou o oponente. Agora vai pro cemitério.
        setSpellZone((prev) => {
          const nz = [...prev];
          nz[spellIndex] = null;
          return nz;
        });
        setGraveyard((prev) => [
          ...prev,
          { ...spellCard, isFaceDown: false, cardPosition: "attack" },
        ]);
        setResolvingEffectId(null);
        setActiveFieldCardId(null);
      }, 1500);
      return;
    }

    setTimeout(async () => {
      if (spellCard.name === "Buraco Negro Dimensional") {
        const myTargets = monsterZone
          .map((c, i) => ({ card: c, index: i, owner: "me" }))
          .filter((t) => t.card !== null);
        const oppTargets = opponentMonsterZone
          .map((c, i) => ({ card: c, index: i, owner: "opp" }))
          .filter((t) => t.card !== null);
        const allTargets = [...myTargets, ...oppTargets];

        for (let i = 0; i < allTargets.length; i++) {
          const target = allTargets[i];
          if (target.owner === "opp") {
            setOpponentMonsterZone((prev) => {
              const nz = [...prev];
              nz[target.index] = null;
              return nz;
            });
            setOpponentGraveyard((prev) => [
              ...prev,
              { ...target.card!, isFaceDown: false, cardPosition: "attack" },
            ]);
          } else {
            setMonsterZone((prev) => {
              const nz = [...prev];
              nz[target.index] = null;
              return nz;
            });
            setGraveyard((prev) => [
              ...prev,
              { ...target.card!, isFaceDown: false, cardPosition: "attack" },
            ]);
          }
          await new Promise((resolve) => setTimeout(resolve, 80));
        }

        setSpellZone((prev) => {
          const nz = [...prev];
          nz[spellIndex] = null;
          return nz;
        });
        setGraveyard((prev) => [
          ...prev,
          { ...spellCard, isFaceDown: false, cardPosition: "attack" },
        ]);
      }

      setResolvingEffectId(null);
      setActiveFieldCardId(null);
    }, 1500);
  };

  // === COMBATE ===
  const handleAttackMonster = (targetCard: Card, targetIndex: number) => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha (Battle Phase)!");
    if (!attackerInfo || attackingAnimId) return;

    const attackerEl = document.getElementById(
      `my-monster-${attackerInfo.index}`,
    );
    const targetEl = document.getElementById(`opp-monster-${targetIndex}`);

    let xOffset = 0;
    let yOffset = -250;
    if (attackerEl && targetEl) {
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      xOffset = tRect.left - aRect.left;
      yOffset = tRect.top - aRect.top;
    }

    setAttackTrajectory({ x: xOffset, y: yOffset });
    setAttackingAnimId(attackerInfo.card.id);

    setTimeout(() => {
      const myAtk =
        "attack" in attackerInfo.card ? attackerInfo.card.attack : 0;
      const oppAtk = "attack" in targetCard ? targetCard.attack : 0;
      const oppDef = "defense" in targetCard ? targetCard.defense : 0;

      const cleanCardForGy = (c: Card) => ({
        ...c,
        isFaceDown: false,
        cardPosition: "attack" as const,
      });

      if (targetCard.cardPosition === "attack") {
        if (myAtk > oppAtk) {
          setOpponentLP((prev) => prev - (myAtk - oppAtk));
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
        } else if (myAtk < oppAtk) {
          setPlayerLP((prev) => prev - (oppAtk - myAtk));
          setMonsterZone((prev) => {
            const nz = [...prev];
            nz[attackerInfo.index] = null;
            return nz;
          });
          setGraveyard((prev) => [...prev, cleanCardForGy(attackerInfo.card)]);
        } else {
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
          setMonsterZone((prev) => {
            const nz = [...prev];
            nz[attackerInfo.index] = null;
            return nz;
          });
          setGraveyard((prev) => [...prev, cleanCardForGy(attackerInfo.card)]);
        }
      } else {
        if (myAtk > oppDef) {
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
        } else if (myAtk < oppDef) {
          setPlayerLP((prev) => prev - (oppDef - myAtk));
        }
      }

      setAttackingAnimId(null);
      setAttackTrajectory(null);
      setAttackerInfo(null);
    }, 500);
  };

  const handleDirectAttack = () => {
    if (!attackerInfo || attackingAnimId) return;
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha (Battle Phase)!");
    const hasMonsters = opponentMonsterZone.some((slot) => slot !== null);
    if (hasMonsters) {
      alert(
        "Você não pode atacar diretamente se o oponente tem monstros no campo!",
      );
      setAttackerInfo(null);
      return;
    }

    const attackerEl = document.getElementById(
      `my-monster-${attackerInfo.index}`,
    );
    const targetEl = document.getElementById(`opp-lp-hud`);
    let xOffset = 0;
    let yOffset = -450;
    if (attackerEl && targetEl) {
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      xOffset = tRect.left + tRect.width / 2 - (aRect.left + aRect.width / 2);
      yOffset = tRect.top - aRect.top;
    }

    setAttackTrajectory({ x: xOffset, y: yOffset });
    setAttackingAnimId(attackerInfo.card.id);

    setTimeout(() => {
      const myAtk =
        "attack" in attackerInfo.card ? attackerInfo.card.attack : 0;
      setOpponentLP((prev) => prev - myAtk);
      setAttackingAnimId(null);
      setAttackTrajectory(null);
      setAttackerInfo(null);
    }, 500);
  };

  return (
    <main
      onClick={() => {
        // 👇 BLINDA O FUNDO DA TELA
        if (pendingEquip) {
          alert(
            "Selecione um alvo válido (iluminado em amarelo) para equipar a carta!",
          );
          return;
        }
        setActiveHandCardId(null);
        setActiveFieldCardId(null);
      }}
      className="h-screen w-screen flex bg-gray-950 overflow-hidden font-sans text-white"
    >
      {/* 1. PAINEL LATERAL ESQUERDO */}
      <div
        className="w-[360px] h-full bg-gray-900 border-r-4 border-gray-800 p-4 shrink-0 flex items-center z-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardDetail card={selectedCard} />
      </div>
      {/* 2. TABULEIRO PRINCIPAL */}
      <div className="flex-1 h-full relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-gray-900 to-black">
        {/* === HUD OPONENTE === */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div
            id="opp-lp-hud"
            onClick={(e) => {
              e.stopPropagation();
              if (pendingEquip)
                return alert("Selecione um alvo válido para o equipamento!");
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

        {/* Mão do Oponente */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-8 scale-[0.60] z-10">
          {opponentHand.length === 0 && (
            <span className="text-gray-500 italic mt-12 text-lg">
              Deck Oponente para simular
            </span>
          )}

          {opponentHand.map((card) => (
            <CardView
              key={`opp-hand-${card.id}`}
              card={{ ...card, isFaceDown: true }} // 👇 A mágica está aqui! Usamos a carta real, mas forçamos ela a ficar virada para baixo!
              disableDrag={true}
              isOpponent={true}
            />
          ))}
        </div>

        {/* === PLAYMAT === */}
        <div className="scale-[0.80] 2xl:scale-95 origin-center flex flex-col gap-3 rounded-xl p-4">
          {/* LINHA 1: OPONENTE */}
          <div className="flex gap-8 justify-center">
            <div
              onClick={drawOpponentCard}
              className={`w-[100px] h-[145px] border-4 rounded-sm bg-red-900 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${
                currentPhase === "draw" && currentPlayer === "opponent"
                  ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "border-gray-600 hover:border-gray-400"
              }`}
            >
              <span className="text-red-300/50 font-bold text-[10px]">
                DECK ({opponentDeck.length})
              </span>
            </div>

            <div className="flex gap-6">
              {opponentSpellZone.map((c, i) => (
                <div
                  key={`o-s-${i}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-red-500/30 bg-red-500/5 rounded-sm flex items-center justify-center relative"
                >
                  {!c ? (
                    <span className="text-red-500/30 text-[10px] font-bold">
                      MÁGICA
                    </span>
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <CardView card={c} isOpponent={true} />
                    </div>
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

          {/* LINHA 2: OPONENTE */}
          <div className="flex gap-8 justify-center">
            <div className="flex flex-col gap-2 w-[100px] items-center">
              <span className="text-red-500/80 text-[10px] font-bold text-center">
                BANIDAS: {opponentBanished.length}
              </span>
              <div
                onClick={() => {
                  if (pendingEquip)
                    return alert(
                      "Conclua o Equipamento antes de olhar os cemitérios!",
                    );
                  opponentGraveyard.length > 0 &&
                    setShowOpponentGraveyardModal(true);
                }}
                className="relative w-[100px] h-[145px] border-2 border-solid border-gray-700 rounded-sm bg-gray-800 flex flex-col items-center justify-center shadow-inner cursor-pointer hover:border-gray-500 transition-colors"
              >
                {opponentGraveyard.length === 0 ? (
                  <>
                    <span className="text-gray-500 text-[10px] font-bold">
                      CEMITÉRIO
                    </span>
                    <span className="text-red-500/80 text-xs mt-1">0</span>
                  </>
                ) : (
                  <div className="absolute top-0 left-0 z-10 w-full h-full">
                    <CardView
                      card={opponentGraveyard[opponentGraveyard.length - 1]}
                      disableDrag={true}
                      onClick={setSelectedCard}
                    />
                    <div className="absolute -bottom-3 right-0 bg-red-950 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-red-700 z-50">
                      {opponentGraveyard.length}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {opponentMonsterZone.map((cardInZone, index) => {
                const isDirectAttackTarget =
                  attackerInfo &&
                  !cardInZone &&
                  !opponentMonsterZone.some((c) => c !== null);
                const isEquipTarget =
                  pendingEquip &&
                  isValidEquipTarget(pendingEquip.spellCard, cardInZone);

                return (
                  <div
                    key={`opp-monster-${index}`}
                    id={`opp-monster-${index}`}
                    className={`w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative ${
                      isEquipTarget
                        ? "z-[9999] border-yellow-400 bg-yellow-400/20 cursor-crosshair animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]" // 👇 Z-9999 AQUI PARA FURAR O ESCUDO!
                        : attackerInfo && cardInZone
                          ? "z-[9999] border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse"
                          : isDirectAttackTarget
                            ? "z-[9999] border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse"
                            : "border-red-500/30 bg-red-500/5"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 👇 BLINDAGEM LÓGICA AQUI!
                      if (pendingEquip) {
                        if (isEquipTarget && cardInZone) {
                          handleEquipToMonster(cardInZone, index, true);
                        } else {
                          alert(
                            "Este monstro não é um alvo válido para o equipamento!",
                          );
                        }
                        return; // Impede ataque acidental!
                      }

                      if (attackerInfo && cardInZone) {
                        handleAttackMonster(cardInZone, index);
                      } else if (isDirectAttackTarget) {
                        handleDirectAttack();
                      }
                    }}
                  >
                    {!cardInZone ? (
                      <span className="text-red-500/30 text-[10px] font-bold">
                        MONSTRO
                      </span>
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <CardView card={cardInZone} isOpponent={true} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="w-[100px] h-[145px] mt-6 border-2 border-dashed border-red-400/30 bg-red-500/5 rounded-sm flex flex-col items-center justify-center relative">
              <span className="text-red-500/40 text-[10px] font-bold text-center">
                MAGIA DE
                <br />
                CAMPO
              </span>
            </div>
          </div>

          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent my-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

          {/* LINHA 3: JOGADOR 1 */}
          <div className="flex gap-8 justify-center">
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
                      if (pendingEquip)
                        return alert("Selecione o alvo do equipamento!");
                      setSelectedCard(c);
                      setActiveFieldCardId(c.id);
                      setActiveHandCardId(null);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-6">
              {monsterZone.map((cardInZone, index) => {
                const isEquipTarget =
                  pendingEquip &&
                  isValidEquipTarget(pendingEquip.spellCard, cardInZone);

                return (
                  <div
                    key={`p-m-${index}`}
                    id={`my-monster-${index}`}
                    className={`w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative ${
                      isEquipTarget
                        ? "z-[9999] border-yellow-400 bg-yellow-400/20 cursor-crosshair animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]" // 👇 Z-9999 AQUI TAMBÉM!
                        : "border-blue-500/40 bg-blue-500/10"
                    }`}
                  >
                    {!cardInZone ? (
                      <span className="text-blue-500/50 text-[10px] font-bold">
                        MONSTRO
                      </span>
                    ) : (
                      <div
                        className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 👇 BLINDAGEM LÓGICA AQUI
                          if (pendingEquip) {
                            if (isEquipTarget && cardInZone) {
                              handleEquipToMonster(cardInZone, index, false);
                            } else {
                              alert(
                                "Este monstro não é um alvo válido para o equipamento!",
                              );
                            }
                            return;
                          }
                        }}
                      >
                        {attackerInfo?.card.id === cardInZone.id && (
                          <div className="absolute inset-0 border-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                        )}

                        {activeFieldCardId === cardInZone.id && (
                          <div className="absolute -top-[50px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                            {cardInZone.cardPosition === "attack" &&
                              !cardInZone.isFaceDown && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttackerInfo({
                                      card: cardInZone,
                                      index,
                                    });
                                    setActiveFieldCardId(null);
                                  }}
                                  className="bg-orange-600 hover:bg-orange-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                                >
                                  Atacar
                                </button>
                              )}
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
                            attackTrajectory={
                              attackingAnimId === cardInZone.id
                                ? attackTrajectory
                                : null
                            }
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
                );
              })}
            </div>

            <div className="flex flex-col gap-2 w-[100px] items-center">
              <span className="text-gray-400 text-[10px] font-bold text-center">
                BANIDAS: {banished.length}
              </span>
              <div
                onClick={() => {
                  if (pendingEquip)
                    return alert(
                      "Conclua o Equipamento antes de olhar os cemitérios!",
                    );
                  graveyard.length > 0 && setShowGraveyardModal(true);
                }}
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

          {/* LINHA 4: JOGADOR 1 */}
          <div className="flex gap-8 justify-center">
            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/50 bg-purple-500/10 rounded-sm flex items-center justify-center">
              <span className="text-purple-500/50 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>

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
                      {resolvingEffectId === cardInZone.id && (
                        <div className="absolute inset-0 border-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                      )}

                      {/* MENU DE MÁGICA/ARMADILHA VOLTOU AQUI! */}
                      {activeFieldCardId === cardInZone.id && (
                        <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                          {/* 👇 BOTÃO ATIVAR (Agora o Buraco Negro só ativa no seu turno!) */}
                          {cardInZone.isFaceDown &&
                            // Se for Mágica (Normal ou Equipamento COM ALVO), ou se for Armadilha de Turno Passado
                            ((cardInZone.cardType === "Spell" &&
                              currentPlayer === "player") ||
                              (cardInZone.cardType === "EquipSpell" &&
                                currentPlayer === "player" &&
                                canActivateEquip(cardInZone)) ||
                              (cardInZone.cardType === "Trap" &&
                                cardInZone.turnSet !== undefined &&
                                currentTurn > cardInZone.turnSet)) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateSpell(cardInZone, index);
                                  setActiveFieldCardId(null);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                              >
                                Ativar
                              </button>
                            )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendToGraveyard(cardInZone, "spell", index);
                            }}
                            className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                          >
                            Cemitério
                          </button>
                        </div>
                      )}
                      <CardView
                        card={cardInZone}
                        onClick={(c) => {
                          if (pendingEquip)
                            return alert("Conclua o Equipamento!");
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

            <div
              onClick={drawCard}
              className={`relative w-[100px] h-[145px] border-4 rounded-sm bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${
                currentPhase === "draw" && currentPlayer === "player"
                  ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "border-white hover:scale-105"
              }`}
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

        {/* === HUD JOGADOR 1 === */}
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

        {/* === MÃO DO JOGADOR === */}
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
                    card.cardType === "FieldSpell" ||
                    card.cardType === "EquipSpell") && (
                    <>
                      {(card.cardType !== "EquipSpell" ||
                        canActivateEquip(card)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayCard(card, false);
                          }}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                        >
                          <div className="w-3 h-5 border border-white bg-emerald-500"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Ativar
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayCard(card, true);
                        }}
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
                  if (pendingEquip)
                    return alert("Você precisa equipar o feitiço primeiro!");
                  setSelectedCard(c);
                  setActiveHandCardId(c.id);
                  setActiveFieldCardId(null);
                }}
                onPlayCard={(c) => {
                  if (pendingEquip) return;
                  handlePlayCard(c, false);
                }}
              />
            </div>
          ))}
        </div>

        {/* === MODAIS DE CEMITÉRIO === */}
        {showGraveyardModal && (
          <div
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col p-8 border-l-4 border-blue-900"
            onClick={() => setShowGraveyardModal(false)}
          >
            <div className="w-full flex justify-between items-center mb-6 border-b-2 border-blue-900 pb-4">
              <h2 className="text-2xl font-bold text-blue-500 uppercase tracking-widest">
                Cemitério do Jogador ({graveyard.length})
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

        {showOpponentGraveyardModal && (
          <div
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col p-8 border-r-4 border-red-900"
            onClick={() => setShowOpponentGraveyardModal(false)}
          >
            <div className="w-full flex justify-between items-center mb-6 border-b-2 border-red-900 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-red-500 uppercase tracking-widest">
                Cemitério do Oponente ({opponentGraveyard.length})
              </h2>
              <button
                onClick={() => setShowOpponentGraveyardModal(false)}
                className="text-gray-400 hover:text-white font-bold text-3xl transition-colors bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
              >
                &times;
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto flex flex-wrap gap-4 justify-start content-start p-4 bg-black/30 rounded-xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {[...opponentGraveyard].reverse().map((c, i) => (
                <CardView
                  key={`opp-gy-modal-${c.id}-${i}`}
                  card={c}
                  disableDrag={true}
                  onClick={setSelectedCard}
                  isOpponent={false} // Mantém false para podermos ler!
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === HUD DE TURNOS E FASES (LADO DIREITO) === */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 items-center z-40 pointer-events-none w-28">
        {/* Painel Numérico do Turno */}
        <div className="bg-gray-900 border-2 border-gray-600 rounded-lg p-3 text-center shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto w-full">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            Turno
          </div>
          <div className="text-4xl font-black text-white font-mono leading-none">
            {currentTurn}
          </div>
        </div>

        {/* Indicador de quem é a vez */}
        <div
          className={`w-full text-center text-[10px] font-bold uppercase tracking-widest py-2 px-2 rounded border-2 transition-all duration-500 pointer-events-auto ${currentPlayer === "player" ? "bg-blue-900/90 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.6)]" : "bg-red-900/90 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.6)]"}`}
        >
          {currentPlayer === "player" ? "Sua Vez" : "Oponente"}
        </div>

        {/* FASES DO TURNO */}
        <div className="flex flex-col gap-1 w-full mt-2 pointer-events-auto">
          {["draw", "main", "battle", "end"].map((phase) => (
            <div
              key={phase}
              className={`text-center py-1 px-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                currentPhase === phase
                  ? "bg-yellow-500 text-black border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.8)] scale-110 z-10"
                  : "bg-gray-800 text-gray-500 border-gray-700 opacity-50"
              }`}
            >
              {phase}
            </div>
          ))}
        </div>

        {/* Botão de Próxima Fase */}
        <button
          onClick={handleNextPhase}
          disabled={
            pendingEquip !== null ||
            attackingAnimId !== null ||
            resolvingEffectId !== null ||
            currentPhase === "draw"
          }
          className={`mt-2 border-2 font-black uppercase tracking-widest py-3 px-2 rounded-xl transition-all pointer-events-auto shadow-xl flex flex-col items-center justify-center gap-1 w-full ${
            currentPhase === "draw"
              ? "bg-gray-900 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed" // Na Draw Phase, tem que clicar no deck!
              : "bg-gray-800 hover:bg-gray-700 border-gray-500 hover:border-white text-gray-300 hover:text-white active:scale-95"
          }`}
        >
          <span className="text-[10px] text-gray-400">
            {currentPhase === "end" ? "Passar" : "Próxima"}
          </span>
          <span className="text-sm leading-none">
            {currentPhase === "end" ? "Turno" : "Fase"}
          </span>
        </button>
      </div>

      {/* ESCUDO INVISÍVEL ÚNICO PARA TRAVAR A TELA APENAS EM ANIMAÇÕES */}
      {(attackingAnimId || resolvingEffectId) && (
        <div
          className="fixed inset-0 z-[9000] cursor-wait"
          onClick={(e) => e.stopPropagation()}
        ></div>
      )}
    </main>
  );
}
